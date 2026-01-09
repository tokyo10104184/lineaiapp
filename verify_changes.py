from playwright.sync_api import sync_playwright, expect
import time

def verify_frontend():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 720})
        page = context.new_page()

        try:
            print("Navigating to http://localhost:3000...")
            page.goto("http://localhost:3000")
            page.wait_for_load_state("networkidle")

            # Screenshot initial state
            page.screenshot(path="verification_initial.png")
            print("Initial screenshot taken.")

            # Handle Age Verification
            print("Handling Age Verification...")
            try:
                # Wait for the modal content
                expect(page.get_by_text("あなたは18歳以上ですか？")).to_be_visible(timeout=5000)
                page.get_by_role("button", name="はい").click()
                print("Clicked 'はい'")
                time.sleep(1) # Wait for animation
            except Exception as e:
                print(f"Age verification handling warning: {e}")

            # 1. Verify Public Character List is visible
            print("Verifying Public Character List...")
            # It might be behind loading spinner or something, but header should be there
            try:
                expect(page.get_by_text("公開キャラクター")).to_be_visible(timeout=10000)
            except AssertionError:
                print("Could not find '公開キャラクター'. Taking debug screenshot.")
                page.screenshot(path="verification_debug.png")
                raise

            # Take screenshot of the main list
            page.screenshot(path="verification_main.png")
            print("Main list screenshot taken.")

            # 2. Verify Character Settings (Publish Button)
            # Need to select a character (Yuki)
            print("Selecting character 'ユキ' from sidebar...")

            # If sidebar is hidden (mobile), open it. But we are 1280px wide.

            # Click Yuki in sidebar
            # Note: sidebar items might be loaded via client-side logic.
            # We need to find the element that contains 'ユキ' and click it.
            # There might be multiple 'ユキ' (in list and potentially in main area if we selected her).
            # The sidebar item usually has a class or structure.
            # Let's just click the first text "ユキ" found.
            page.get_by_text("ユキ").first.click()

            # Hover and click Edit
            print("Clicking Edit button...")
            # The edit button appears on hover in the sidebar item.
            # Let's target the sidebar item specifically if possible.
            # Or just blindly click the edit icon (FaEdit) if visible.
            # It has title="キャラクター編集"

            # Force hover on the sidebar item containing Yuki
            # Assuming the layout: Sidebar -> Item -> [Icon, Name, Buttons]
            # We can find the edit button by title.
            # But there are multiple edit buttons (one per character).
            # We need the first one (corresponding to Yuki if she is top).
            # Actually, Yuki is top in default list.

            # Use JS to force click to avoid hover issues in headless
            # page.get_by_title("キャラクター編集").first.click()
            # But hover is needed for opacity-0?
            # CSS: group-hover:opacity-100. Playwright hover triggers this.

            page.get_by_text("ユキ").first.hover()
            page.get_by_title("キャラクター編集").first.click()

            # Verify "公開済み" or "Publish" button
            # Since default characters have isPublic=true (simulated in index.tsx), it should say "公開済み"
            expect(page.get_by_text("公開済み")).to_be_visible()

            page.screenshot(path="verification_settings.png")
            print("Settings screenshot taken.")

            # Close settings
            page.get_by_text("キャンセル").click()

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification_error.png")
            raise e
        finally:
            browser.close()

if __name__ == "__main__":
    verify_frontend()
