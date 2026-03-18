Run a full security and test audit of the project. Execute the following steps in order and report results:

1. Run `npm audit` and capture the output. Note the number of vulnerabilities found (critical, high, moderate, low).
2. Run `npm audit fix` and capture the output. Note what was fixed.
3. Run `npm audit` again to check if vulnerabilities remain after the fix.
4. Run `npm test` and capture the output. Note passing and failing tests.

After all steps complete, print a summary report in this format:

---
## Audit Report

### Security Audit
- **Status**: PASS or FAIL (FAIL if any vulnerabilities remain after fix)
- **Before fix**: X vulnerabilities (critical: N, high: N, moderate: N, low: N)
- **After fix**: X vulnerabilities remaining (or "none" if clean)

### Tests
- **Status**: PASS or FAIL
- **Results**: X passed, X failed

### Overall: PASS or FAIL
---

Overall is PASS only if both security audit and tests pass.
