/* vnmsim.js — our own faithful Von Neumann Machine simulator engine for CSSA CW1.
 * Reproduces the REAL vnmsim (github.com/c2r0b/vnmsim) instruction set, verified against the repo's own
 * sample programs (see test.js). Works in Node and the browser (UMD).
 *
 * ISA: LOD var|#num · STO var · ADD/SUB/MUL/DIV var|#num · JMZ cell · JMP cell · NOP · HLT
 *  - ACC = accumulator; memory cells are NAMED (X, Y, Z, W are conventional; any name auto-creates at 0).
 *  - #num = immediate (negatives ok, e.g. #-1); a bare name = a memory cell.
 *  - JUMPS TARGET A NUMERIC CELL = the 0-based LINE INDEX, COUNTING comment lines and blank lines.
 *    There are NO labels. JMP 4 jumps to source line 4. Adding/removing a line shifts every jump target.
 *  - Comment lines (// …) and blank lines are valid cells that act as NOP (the PC passes through them).
 *  - DIV is integer division (truncated toward zero). The result conventionally lives in cell Z.
 */
(function (root) {
  'use strict';

  var OPS = { LOD: 1, STO: 1, ADD: 1, SUB: 1, MUL: 1, DIV: 1, JMZ: 1, JMP: 1, NOP: 1, HLT: 1 };
  var NEEDS_ARG = { LOD: 1, STO: 1, ADD: 1, SUB: 1, MUL: 1, DIV: 1, JMZ: 1, JMP: 1 };
  var JUMPS = { JMZ: 1, JMP: 1 };
  var ARITH = { LOD: 1, ADD: 1, SUB: 1, MUL: 1, DIV: 1 };

  function parse(src) {
    var lines = src.replace(/\r/g, '').split('\n');
    var cells = lines.map(function (raw) {
      var code = raw.split('//')[0].trim();        // strip trailing/whole-line comments
      if (!code || /^-?\d+$/.test(code)) return null; // blank / comment / bare-number -> NOP cell (matches vnmsim)
      var m = code.match(/^(\S+)(?:\s+(.*))?$/);
      // The REAL vnmsim uppercases the operand (line.substr(4).toUpperCase()), so cell names are
      // CASE-INSENSITIVE: `LOD x` reads cell X. We match that exactly by uppercasing op AND arg.
      return { op: m[1].toUpperCase(), arg: m[2] != null ? m[2].trim().toUpperCase() : null };
    });
    return { cells: cells, lines: lines };
  }

  // Compile-time validation — flags anything that is not a legal vnmsim instruction.
  // Returns { ok, errors:[{line, text, msg}] }. Used by Assemble ("compile") before running.
  function validate(src) {
    var lines = src.replace(/\r/g, '').split('\n');
    var errs = [];
    lines.forEach(function (raw, i) {
      var code = raw.split('//')[0].trim();
      if (!code || /^-?\d+$/.test(code)) return;   // NOP line (blank / comment / bare number)
      var m = code.match(/^(\S+)(?:\s+(.*))?$/);
      var op = m[1].toUpperCase(), arg = m[2] != null ? m[2].trim().toUpperCase() : null;
      if (!OPS[op]) { errs.push({ line: i, text: code, msg: 'unknown instruction "' + m[1] + '" — not in the instruction set (LOD STO ADD SUB MUL DIV JMZ JMP NOP HLT)' }); return; }
      if (NEEDS_ARG[op] && (arg == null || arg === '')) { errs.push({ line: i, text: code, msg: op + ' needs an operand' }); return; }
      if (JUMPS[op] && !/^-?\d+$/.test(arg || '')) { errs.push({ line: i, text: code, msg: op + ' must jump to a LINE NUMBER — vnmsim has no labels (got "' + arg + '")' }); return; }
      if (ARITH[op] && arg && arg.charAt(0) === '#' && isNaN(parseInt(arg.slice(1), 10))) { errs.push({ line: i, text: code, msg: 'bad immediate "' + arg + '" — use #<number>, e.g. #5 or #-1' }); return; }
      if ((op === 'STO') && arg && arg.charAt(0) === '#') { errs.push({ line: i, text: code, msg: 'cannot STO into an immediate "' + arg + '" — STO needs a cell name (X, Y, Z, W, T0…)' }); return; }
    });
    return { ok: errs.length === 0, errors: errs };
  }

  function VNM() { this.prog = { cells: [], lines: [] }; this.initMem = {}; this.reset({}); }

  VNM.prototype.load = function (src, mem) {
    this.prog = parse(src); this.src = src;
    this.reset(mem || this.initMem);
  };
  VNM.prototype.reset = function (mem) {
    if (mem) { var M = {}; for (var k in mem) if (mem.hasOwnProperty(k)) M[k.toUpperCase()] = mem[k]; this.initMem = JSON.parse(JSON.stringify(M)); } // cell names are case-insensitive
    this.mem = JSON.parse(JSON.stringify(this.initMem || {}));
    this.acc = 0; this.pc = 0; this.steps = 0; this.halted = false; this.error = null;
  };
  VNM.prototype.val = function (a) {
    if (a == null) throw new Error('missing operand');
    if (a.charAt(0) === '#') {
      var n = parseInt(a.slice(1), 10);
      if (isNaN(n)) throw new Error('bad immediate ' + a);
      return n;
    }
    var v = this.mem[a];
    return (v == null) ? 0 : v;                      // unknown cell defaults to 0
  };
  VNM.prototype.step = function () {
    if (this.halted) return;
    var cells = this.prog.cells;
    if (this.pc < 0 || this.pc >= cells.length) { this.halted = true; return; }
    this.steps++;
    this.lastPC = this.pc;
    var c = cells[this.pc];
    if (c == null) { this.pc++; return; }            // NOP (comment/blank line)
    var op = c.op, arg = c.arg;
    try {
      if (op === 'LOD') { this.acc = this.val(arg); this.pc++; }
      else if (op === 'STO') { if (arg == null) throw new Error('STO needs a cell name'); this.mem[arg] = this.acc; this.pc++; }
      else if (op === 'ADD') { this.acc += this.val(arg); this.pc++; }
      else if (op === 'SUB') { this.acc -= this.val(arg); this.pc++; }
      else if (op === 'MUL') { this.acc *= this.val(arg); this.pc++; }
      else if (op === 'DIV') { var d = this.val(arg); if (d === 0) throw new Error('division by zero is undefined'); this.acc = Math.trunc(this.acc / d); this.pc++; }
      else if (op === 'JMZ') { var t = parseInt(arg, 10); if (isNaN(t)) throw new Error('JMZ needs a line number'); this.pc = (this.acc === 0) ? t : this.pc + 1; }
      else if (op === 'JMP') { var t2 = parseInt(arg, 10); if (isNaN(t2)) throw new Error('JMP needs a line number'); this.pc = t2; }
      else if (op === 'NOP') { this.pc++; }
      else if (op === 'HLT') { this.halted = true; }
      else throw new Error('unknown instruction "' + op + '"');
    } catch (e) { this.error = e.message; this.halted = true; }
  };
  VNM.prototype.run = function (maxSteps) {
    maxSteps = maxSteps || 100000; var n = 0;
    while (!this.halted && n < maxSteps) { this.step(); n++; }
    if (!this.halted && n >= maxSteps) { this.error = 'step limit exceeded — infinite loop (does anything reach the JMZ exit?)'; this.halted = true; }
    return { acc: this.acc, mem: this.mem, halted: this.halted, error: this.error, steps: this.steps };
  };
  // cell names referenced anywhere in the program (so the UI can show them all)
  VNM.prototype.cellNames = function () {
    var set = {};
    this.prog.cells.forEach(function (c) {
      if (c && c.arg && c.arg.charAt(0) !== '#' && /^[A-Za-z_]\w*$/.test(c.arg)) set[c.arg] = 1;
    });
    Object.keys(this.mem).forEach(function (k) { set[k] = 1; });
    return Object.keys(set);
  };

  var API = { parse: parse, validate: validate, VNM: VNM };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else root.vnmsim = API;
})(typeof window !== 'undefined' ? window : globalThis);
