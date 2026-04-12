with open("test-comprehensive.mjs", "r") as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    if '5.3 Enter round 2 to trigger winner' in line:
        new_lines.append(line)
        new_lines.append("  await safeClick(page, '.nav-item[data-tab=\"scoring\"]');\n")
        new_lines.append("  await page.waitForTimeout(1000);\n")
    else:
        new_lines.append(line)

with open("test-comprehensive.mjs", "w") as f:
    f.writelines(new_lines)
