<?php

declare(strict_types=1);

namespace Buddy\Repman\Service\PackageSynchronizer;

use Composer\Config;
use Composer\IO\IOInterface;
use Composer\Repository\Vcs\VcsDriverInterface;

/**
 * Drops composer.json "version" so Composer uses the VCS tag/branch name instead.
 *
 * Without this, Composer silently skips tags when the hardcoded version does not match
 * the tag (sync succeeds, webhook returns 202, but the new release never appears).
 */
final class IgnoreComposerJsonVersionVcsDriver implements VcsDriverInterface
{
    private VcsDriverInterface $driver;

    public function __construct(VcsDriverInterface $driver)
    {
        $this->driver = $driver;
    }

    public function initialize(): void
    {
        $this->driver->initialize();
    }

    /**
     * @return mixed[]|null
     */
    public function getComposerInformation(string $identifier): ?array
    {
        $data = $this->driver->getComposerInformation($identifier);

        if (\is_array($data)) {
            unset($data['version']);
        }

        return $data;
    }

    public function getFileContent(string $file, string $identifier): ?string
    {
        return $this->driver->getFileContent($file, $identifier);
    }

    public function getChangeDate(string $identifier): ?\DateTimeImmutable
    {
        return $this->driver->getChangeDate($identifier);
    }

    public function getRootIdentifier(): string
    {
        return $this->driver->getRootIdentifier();
    }

    /**
     * @return array<int|string, string>
     */
    public function getBranches(): array
    {
        return $this->driver->getBranches();
    }

    /**
     * @return array<int|string, string>
     */
    public function getTags(): array
    {
        return $this->driver->getTags();
    }

    /**
     * @return array{type: string, url: string, reference: string, shasum: string}|null
     */
    public function getDist(string $identifier): ?array
    {
        return $this->driver->getDist($identifier);
    }

    /**
     * @return array{type: string, url: string, reference: string}
     */
    public function getSource(string $identifier): array
    {
        return $this->driver->getSource($identifier);
    }

    public function getUrl(): string
    {
        return $this->driver->getUrl();
    }

    public function hasComposerFile(string $identifier): bool
    {
        return $this->driver->hasComposerFile($identifier);
    }

    public function cleanup(): void
    {
        $this->driver->cleanup();
    }

    public static function supports(IOInterface $io, Config $config, string $url, bool $deep = false): bool
    {
        return false;
    }
}
