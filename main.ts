// Tiny Stack VM — standalone readable interpreter for the tiny stack ISA.
// No environment secret, no network, no WebAssembly: the whole VM is this file.
// Deterministic: the same input bytes always produce the same output bytes.
// Golfed VM: same logic as vm_clear.mjs, table-driven dispatch.
// T[b] = (pops<<2)|pushes for opcode b, as hex digits.
const T = Uint8Array.from("01146abf0000000099999995999599909990000000000000044000000000000058000000000000004414", c => parseInt(c, 16));
const E = new TextEncoder();
const F = [(a, b) => (a + b) | 0, (a, b) => (a - b) | 0, Math.imul, (a, b) => (a / b) | 0, (a, b) => (a % b) | 0, (a, b) => Math.floor((a >>> 0) / (b >>> 0)) | 0, (a, b) => ((a >>> 0) % (b >>> 0)) | 0, 0, (a, b) => a & b, (a, b) => a | b, (a, b) => a ^ b, 0, (a, b) => a << (b & 31), (a, b) => a >> (b & 31), (a, b) => (a >>> (b & 31)) | 0, 0, (a, b) => (a == b ? 1 : 0), (a, b) => (a < b ? 1 : 0), (a, b) => ((a >>> 0) < (b >>> 0) ? 1 : 0)];
function R(p, q) {
  let S = new Int32Array(256), s = 0, C = new Int32Array(64), c = 0, M = new Int32Array(256);
  let o = new Uint8Array(65536), l = 0, i = 0, x = 0, t = 0;
  const D = (e) => [o.subarray(0, l), e];
  for (;;) {
    if (t == 1e6) return D(10);
    if (x < 0 || x >= p.length) return D(9);
    let b = p[x];
    if (!(b < 8 || (b > 15 && b < 35 && b != 31) || (b > 47 && b < 53) || b == 64 || b == 65 || (b > 79 && b < 84))) return D(5);
    let m = b == 1 ? 1 : b == 2 ? 4 : (b > 47 && b < 52 ? 2 : 0);
    if (x + m >= p.length) return D(9);
    t++;
    let n = x + 1 + m, v = T[b], u = v >> 2, w = v & 3;
    if (s < u) return D(2);
    if (s - u + w > 256) return D(3);
    x = n;
    if (b == 0) return D(0);
    if (b == 1) { S[s++] = (p[n - 1] << 24) >> 24; continue; }
    if (b == 2) { S[s++] = p[n - 4] | (p[n - 3] << 8) | (p[n - 2] << 16) | (p[n - 1] << 24); continue; }
    if (b == 3) { s--; continue; }
    if (b == 4) { S[s] = S[s - 1]; s++; continue; }
    if (b == 5) { let t2 = S[s - 1]; S[s - 1] = S[s - 2]; S[s - 2] = t2; continue; }
    if (b == 6) { S[s] = S[s - 2]; s++; continue; }
    if (b == 7) { let a = S[s - 3]; S[s - 3] = S[s - 2]; S[s - 2] = S[s - 1]; S[s - 1] = a; continue; }
    if (b == 23) { S[s - 1] = -S[s - 1] | 0; continue; }
    if (b == 27) { S[s - 1] = ~S[s - 1]; continue; }
    if (b > 15 && b < 35) {
      let y = S[s - 1], a = S[s - 2], r;
      if (b > 18 && b < 23 && y == 0) return D(4);
      if (b == 19 && a == -2147483648 && y == -1) r = a;
      else if (b == 20 && y == -1) r = 0;
      else r = F[b - 16](a, y);
      s -= 2; S[s++] = r; continue;
    }
    if (b > 47 && b < 51) {
      let rel = ((p[n - 2] | (p[n - 1] << 8)) << 16) >> 16, take = true, z;
      if (b != 48) { z = S[--s]; take = b == 49 ? z == 0 : z != 0; }
      if (take) x = n + rel;
      continue;
    }
    if (b == 51) { if (c == 64) return D(7); C[c++] = n; x = p[n - 2] | (p[n - 1] << 8); continue; }
    if (b == 52) { if (c == 0) return D(8); x = C[--c]; continue; }
    if (b == 64) { let a = S[s - 1]; if (a < 0 || a > 255) return D(6); S[s - 1] = M[a]; continue; }
    if (b == 65) { let a = S[s - 1], y = S[s - 2]; if (a < 0 || a > 255) return D(6); s -= 2; M[a] = y; continue; }
    if (b == 80) { let g = E.encode(String(S[s - 1])); if (l + g.length > 65536) return D(11); s--; o.set(g, l); l += g.length; continue; }
    if (b == 81) { if (l + 1 > 65536) return D(11); o[l++] = S[--s] & 255; continue; }
    if (b == 82) { S[s++] = i < q.length ? q[i++] : -1; continue; }
    return D(S[--s] & 255); // EXIT (b==83)
  }
}

// Driver: answer every instance of the set in one run.
// Reads MAKEFUN_INPUT_DIR (default /input), writes MAKEFUN_OUTPUT_DIR (default /output).
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const I = process.env.MAKEFUN_INPUT_DIR ?? "/input";
const O = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
for (const d of readdirSync(I).sort()) {
  const [out, code] = R(
    new Uint8Array(readFileSync(join(I, d, "program.bin"))),
    new Uint8Array(readFileSync(join(I, d, "input.bin")))
  );
  mkdirSync(join(O, d), { recursive: true });
  writeFileSync(join(O, d, "stdout.bin"), out);
  writeFileSync(join(O, d, "exit.txt"), code + "\n");
}
