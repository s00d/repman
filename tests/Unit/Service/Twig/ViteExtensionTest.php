<?php

declare(strict_types=1);

namespace Buddy\Repman\Tests\Unit\Service\Twig;

use Buddy\Repman\Service\Twig\ViteExtension;
use PHPUnit\Framework\TestCase;

final class ViteExtensionTest extends TestCase
{
    private const MANIFEST = __DIR__.'/../../../Resources/vite/manifest.json';

    public function testRendersStylesheetsScriptAndPreloadsOfAnEntry(): void
    {
        $extension = new ViteExtension(self::MANIFEST);

        self::assertSame(
            '<link rel="stylesheet" href="/build/assets/app-test.css">'."\n"
            .'<script type="module" src="/build/assets/app-test.js"></script>'."\n"
            .'<link rel="modulepreload" href="/build/assets/vue-test.js">',
            $extension->entryTags('assets/app.ts'),
        );
    }

    public function testUsesTheConfiguredBase(): void
    {
        $extension = new ViteExtension(self::MANIFEST, '/repman/build/');

        self::assertStringContainsString('src="/repman/build/assets/app-test.js"', $extension->entryTags('assets/app.ts'));
    }

    public function testFailsOnAnUnknownEntry(): void
    {
        $this->expectExceptionMessage('Vite entry "assets/admin.ts" is not in');

        new ViteExtension(self::MANIFEST)->entryTags('assets/admin.ts');
    }

    public function testFailsWithoutABuild(): void
    {
        $this->expectExceptionMessage('run `npm ci && npm run build`');

        new ViteExtension('/nonexistent/manifest.json')->entryTags('assets/app.ts');
    }
}
