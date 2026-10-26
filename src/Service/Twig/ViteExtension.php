<?php

declare(strict_types=1);

namespace Buddy\Repman\Service\Twig;

use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Twig\Extension\AbstractExtension;
use Twig\TwigFunction;

/**
 * Renders the tags of a Vite entry from public/build/.vite/manifest.json (built by `npm run build`).
 */
final class ViteExtension extends AbstractExtension
{
    /**
     * @var array<string, array{file: string, css?: string[], imports?: string[]}>|null
     */
    private ?array $manifest = null;

    public function __construct(
        #[Autowire(param: 'vite_manifest')]
        private readonly string $manifestPath,
        #[Autowire(param: 'vite_base')]
        private readonly string $base = '/build/',
    ) {
    }

    /**
     * @return TwigFunction[]
     */
    public function getFunctions(): array
    {
        return [
            new TwigFunction('vite_entry_tags', $this->entryTags(...), ['is_safe' => ['html']]),
        ];
    }

    public function entryTags(string $entry): string
    {
        $manifest = $this->manifest();
        $chunk = $manifest[$entry] ?? throw new \RuntimeException(sprintf('Vite entry "%s" is not in %s, run `npm run build`', $entry, $this->manifestPath));

        $tags = [];
        foreach ($chunk['css'] ?? [] as $css) {
            $tags[] = sprintf('<link rel="stylesheet" href="%s">', $this->url($css));
        }
        $tags[] = sprintf('<script type="module" src="%s"></script>', $this->url($chunk['file']));
        foreach ($chunk['imports'] ?? [] as $import) {
            if (isset($manifest[$import])) {
                $tags[] = sprintf('<link rel="modulepreload" href="%s">', $this->url($manifest[$import]['file']));
            }
        }

        return implode("\n", $tags);
    }

    private function url(string $file): string
    {
        return htmlspecialchars($this->base.$file, ENT_QUOTES);
    }

    /**
     * @return array<string, array{file: string, css?: string[], imports?: string[]}>
     */
    private function manifest(): array
    {
        if ($this->manifest === null) {
            if (!is_file($this->manifestPath)) {
                throw new \RuntimeException(sprintf('Vite manifest %s is missing, run `npm ci && npm run build`', $this->manifestPath));
            }
            /** @var array<string, array{file: string, css?: string[], imports?: string[]}> $manifest */
            $manifest = json_decode((string) file_get_contents($this->manifestPath), true, 512, JSON_THROW_ON_ERROR);
            $this->manifest = $manifest;
        }

        return $this->manifest;
    }
}
