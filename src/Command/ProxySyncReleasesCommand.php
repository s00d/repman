<?php

declare(strict_types=1);

namespace Buddy\Repman\Command;

use Buddy\Repman\Service\Downloader;
use Buddy\Repman\Service\Proxy\ProxyRegister;
use Buddy\Repman\Service\Stream;
use Psr\Cache\CacheItemPoolInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Lock\LockFactory;
use Symfony\Component\Lock\LockInterface;

#[AsCommand(name: 'repman:proxy:sync-releases', description: 'Sync proxy releases with packagist.org')]
final class ProxySyncReleasesCommand extends Command
{
    public const LOCK_TTL = 30;

    private ProxyRegister $register;
    private Downloader $downloader;
    private CacheItemPoolInterface $cache;
    private LockInterface $lock;
    private LockFactory $lockFactory;

    public function __construct(ProxyRegister $register, Downloader $downloader, CacheItemPoolInterface $packagistReleasesFeedCache, LockFactory $lockFactory)
    {
        $this->register = $register;
        $this->downloader = $downloader;
        $this->cache = $packagistReleasesFeedCache;
        $this->lockFactory = $lockFactory;

        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $this->lock = $this
            ->lockFactory
            ->createLock('packagist_releases_feed', self::LOCK_TTL);
        if (!$this->lock->acquire()) {
            return Command::SUCCESS;
        }

        try {
            $feed = $this->loadFeed();
            if (!$this->alreadySynced((string) $feed->channel->pubDate)) {
                $this->syncPackages($feed);
            }
        } finally {
            $this->lock->release();
        }

        return Command::SUCCESS;
    }

    private function syncPackages(\SimpleXMLElement $feed): void
    {
        $proxy = $this
            ->register
            ->getByHost('packagist.org');

        $syncedPackages = [];
        foreach ($proxy->syncedPackages() as $name) {
            $syncedPackages[$name] = true;
        }

        foreach ($feed->channel->item as $item) {
            [$name, $version] = explode(' ', (string) $item->guid);
            if (isset($syncedPackages[$name])) {
                $this->lock->refresh();
                $proxy->download($name, $version);
            }
        }
    }

    private function alreadySynced(string $pubDate): bool
    {
        $lastPubDateCashed = $this->cache->getItem('pub_date');
        if (!$lastPubDateCashed->isHit()) {
            $lastPubDateCashed->set($pubDate);
            $this->cache->save($lastPubDateCashed);

            return false;
        }

        $lastPubDate = $lastPubDateCashed->get();

        return new \DateTimeImmutable($pubDate) <= new \DateTimeImmutable($lastPubDate);
    }

    private function loadFeed(): \SimpleXMLElement
    {
        $stream = $this
            ->downloader
            ->getContents('https://packagist.org/feeds/releases.rss')
            ->getOrElse(Stream::fromString(''));

        $xml = @simplexml_load_string((string) stream_get_contents($stream));
        if ($xml === false) {
            throw new \RuntimeException('Unable to parse RSS feed');
        }

        return $xml;
    }
}
