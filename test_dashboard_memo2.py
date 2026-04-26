import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Let external CDNs load but block heavy media
        await page.route("**/*.{png,jpg,jpeg,gif,webp,media}", lambda route: route.abort())

        print("Navigating to home page...")
        await page.goto("http://localhost:8000")

        # Set up a fake local storage state
        await page.evaluate("""
            const roomCode = 'TEST12';
            const fakeData = {
                ts: Date.now(),
                meta: {
                    roomCode: roomCode,
                    hostKey: 'host_key_abc',
                    status: 'playing',
                    activeGameId: 'game_1'
                },
                players: {
                    'p_1': { id: 'p_1', name: 'Alice', isActive: true, seatOrder: 0, accentIndex: 0 },
                    'p_2': { id: 'p_2', name: 'Bob', isActive: true, seatOrder: 1, accentIndex: 1 }
                },
                games: {
                    'game_1': {
                        gameId: 'game_1',
                        type: 'flip7',
                        config: { targetScore: 200 },
                        playerIds: ['p_1', 'p_2'],
                        playerSnapshot: {
                            'p_1': { name: 'Alice', accentIndex: 0 },
                            'p_2': { name: 'Bob', accentIndex: 1 }
                        },
                        rounds: {
                            '0': {
                                entries: {
                                    'p_1': { basePoints: 10 },
                                    'p_2': { basePoints: 20 }
                                }
                            },
                            '1': {
                                entries: {
                                    'p_1': { basePoints: 30 },
                                    'p_2': { basePoints: 5 }
                                }
                            }
                        },
                        totals: {
                            'p_1': 40,
                            'p_2': 25
                        },
                        status: 'active'
                    }
                }
            };
            localStorage.setItem('gns_cache_' + roomCode, JSON.stringify(fakeData));
            localStorage.setItem('gns_host_' + roomCode, 'host_key_abc');
        """)

        # Navigate to the dashboard
        print("Navigating to dashboard...")
        await page.goto("http://localhost:8000/?room=TEST12")

        await page.wait_for_timeout(1000)

        # Force navigation to dashboard explicitly
        await page.evaluate("window.location.hash = '#dashboard'")

        print("Waiting for dashboard to render...")
        await page.wait_for_timeout(2000)

        # Check if the scores are rendered correctly
        content = await page.content()
        if "Alice" in content and "Bob" in content and "40" in content and "25" in content:
            print("Dashboard rendered successfully with the fake data!")
        else:
            print("Dashboard rendering failed or data not found.")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
