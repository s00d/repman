<?php

declare(strict_types=1);

namespace Buddy\Repman\Service\Proxy;

use Buddy\Repman\Service\Downloader;
use Buddy\Repman\Service\Proxy;
use League\Flysystem\FilesystemOperator;

final class ProxyFactory
{
    private Downloader $downloader;
    private FilesystemOperator $filesystem;

    public function __construct(Downloader $downloader, FilesystemOperator $proxyFilesystem)
    {
        $this->downloader = $downloader;
        $this->filesystem = $proxyFilesystem;
    }

    public function create(string $url): Proxy
    {
        return new Proxy(
            (string) parse_url($url, PHP_URL_HOST),
            $url,
            $this->filesystem,
            $this->downloader
        );
    }
}
