Write comprehensive tests for the file or folder passed as `$ARGUMENTS`.

## Steps

1. Read and thoroughly understand every source file in `$ARGUMENTS` — its exports, logic, edge cases, and dependencies.
2. Locate any existing tests for these files (check `__tests__/` subdirectories next to the source files) so you don't duplicate coverage.
3. Identify the right test file location: place tests in a `__tests__/` directory next to the source file, following the existing convention in this project (e.g. `src/lib/__tests__/`, `src/components/chat/__tests__/`).
4. Write the tests using **Vitest** + **Testing Library** (the project's existing stack). Follow patterns already present in sibling `__tests__/` directories.
5. Cover:
   - Happy-path / normal usage
   - Edge cases and boundary conditions
   - Error / failure paths
   - Any async behaviour (streaming, promises)
   - For React components: rendering, user interactions, and prop variations
6. Run the new tests with `npx vitest run <test-file-path>` and iterate until all pass.
7. Run the full test suite with `npm test` to confirm nothing was broken.

## Output

After all tests pass, print a summary:

---
## Write-Tests Report

### Files Analyzed
- List each source file examined

### Test Files Written
- List each test file created or updated, with the number of test cases added

### Results
- **New tests**: X passed, X failed
- **Full suite**: X passed, X failed

### Overall: PASS or FAIL
---

Overall is PASS only if all new tests pass and the full suite remains green.
