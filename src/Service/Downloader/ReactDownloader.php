<?php

declare(strict_types=1);

namespace Buddy\Repman\Service\Downloader;

use Buddy\Repman\Kernel;
use Buddy\Repman\Service\Downloader;
use Clue\React\Mq\Queue;
use Munus\Control\Option;
use Psr\Http\Message\ResponseInterface;
use React\EventLoop\Loop;
use React\EventLoop\LoopInterface;
use React\Http\Browser;
use React\Promise\PromiseInterface;
use React\Socket\Connector;

final class ReactDownloader implements Downloader
{
    private const ATTEMPTS = 3;
    private const MAX_RETRY_DELAY_SECONDS = 5;

    private LoopInterface $loop;
    private Browser $browser;
    /** @var Queue<mixed> */
    private Queue $queue;

    public function __construct()
    {
        $this->loop = Loop::get();
        $this->browser = new Browser($this->loop, new Connector($this->loop, ['timeout' => 10]));
        $this->queue = new Queue(100, null, function (string $type, string $url, array $headers = []): PromiseInterface {
            return $this->browser->request(strtoupper($type), $url, array_merge($headers, ['User-Agent' => $this->userAgent()]));
        });
    }

    /**
     * @param string[] $headers
     *
     * @return Option<resource>
     */
    public function getContents(string $url, array $headers = [], ?callable $notFoundHandler = null): Option
    {
        for ($attempt = 1; $attempt <= self::ATTEMPTS; ++$attempt) {
            $stream = @fopen($url, 'r', false, $this->createContext($headers));
            if ($stream !== false) {
                return Option::some($stream);
            }

            $responseHeaders = http_get_last_response_headers() ?? [];
            $status = $this->getStatusCode($responseHeaders);
            if ($status === 404 && $notFoundHandler !== null) {
                $notFoundHandler();
            }

            // a client error answers the same on every attempt; only rate limits and server errors may pass
            if ($status >= 400 && $status < 500 && $status !== 429) {
                break;
            }

            if ($attempt < self::ATTEMPTS && $status !== 0) {
                usleep($this->retryDelay($responseHeaders, $attempt));
            }
        }

        return Option::none();
    }

    public function getAsyncContents(string $url, array $headers, callable $onFulfilled): void
    {
        ($this->queue)('get', $url, $headers)
            ->then(function (ResponseInterface $response) use ($onFulfilled): void {
                // 304 Not Modified to a conditional request: what is stored is current
                if ($response->getStatusCode() !== 200) {
                    return;
                }
                // the browser buffers the body, and a buffered body cannot be detached into a stream
                $stream = fopen('php://temp', 'r+b');
                if ($stream === false) {
                    return;
                }
                fwrite($stream, (string) $response->getBody());
                rewind($stream);
                $onFulfilled($stream, $response->getHeaderLine('Last-Modified'));
            }, static function (\Throwable $reason): void {
                // a failed refresh keeps what is stored; react/promise 3 logs rejections nobody handles
            });
    }

    /**
     * @param callable(int):void $onFulfilled
     */
    public function getLastModified(string $url, callable $onFulfilled): void
    {
        ($this->queue)('head', $url)->then(function (ResponseInterface $response) use ($onFulfilled): void {
            $lastModified = $response->getHeader('Last-Modified');
            if ($lastModified !== []) {
                $onFulfilled((int) strtotime($lastModified[0]));
            }
        }, static function (\Throwable $reason): void {
        });
    }

    public function run(): void
    {
        $this->loop->run();
    }

    /**
     * @param string[] $headers
     *
     * @return resource
     */
    private function createContext(array $headers = [])
    {
        return stream_context_create([
            'http' => [
                'header' => array_merge([sprintf('User-Agent: %s', $this->userAgent())], $headers),
                'follow_location' => 1,
                'max_redirects' => 20,
            ],
        ]);
    }

    private function userAgent(): string
    {
        return sprintf(
            'Repman/%s (%s; %s; %s)',
            Kernel::REPMAN_VERSION,
            php_uname('s'),
            php_uname('r'),
            'PHP '.PHP_MAJOR_VERSION.'.'.PHP_MINOR_VERSION.'.'.PHP_RELEASE_VERSION
        );
    }

    /**
     * Status of the last response: after redirects the headers hold one status line per hop.
     *
     * @param string[] $headers
     */
    private function getStatusCode(array $headers): int
    {
        $status = 0;
        foreach ($headers as $header) {
            if (preg_match('{^HTTP/\S*\s(\d{3})}', $header, $match) === 1) {
                $status = (int) $match[1];
            }
        }

        return $status;
    }

    /**
     * Microseconds to wait before the next attempt: Retry-After when the server sends one, else a short backoff.
     *
     * @param string[] $headers
     */
    private function retryDelay(array $headers, int $attempt): int
    {
        foreach ($headers as $header) {
            if (preg_match('{^Retry-After:\s*(\d+)\s*$}i', $header, $match) === 1) {
                return min((int) $match[1], self::MAX_RETRY_DELAY_SECONDS) * 1_000_000;
            }
        }

        return 250_000 * 2 ** ($attempt - 1);
    }
}
