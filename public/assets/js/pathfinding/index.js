'use strict';
(() => {
  const rows = 13, cols = 19, size = rows * cols;
  let start = 6 * cols + 3, end = 6 * cols + 15;
  const walls = new Set();
  // A small detour invites experimentation, with a reachable goal.
  for (let row = 2; row < 11; row++) if (row !== 9) walls.add(row * cols + 9);
  const grids = ['bfs', 'dfs'].map(name => ({ name, el: document.querySelector(`#${name}-grid`), cells: [], visited: new Set(), path: new Set() }));
  let timer, running = false, drawing = false, lastDrawn = -1;
  const runButton = document.querySelector('#run');
  function paint(grid, id) {
    const cell = grid.cells[id];
    const state = id === start ? 'start' : id === end ? 'end' : walls.has(id) ? 'wall' : grid.path.has(id) ? 'path' : grid.visited.has(id) ? 'visited' : 'empty';
    cell.className = `path-cell cell-${state}`;
    cell.textContent = state === 'start' ? 'S' : state === 'end' ? 'E' : '';
    cell.setAttribute('aria-label', `Rij ${Math.floor(id / cols) + 1}, kolom ${id % cols + 1}: ${{start:'startpunt',end:'eindpunt',wall:'obstakel',path:'gevonden pad',visited:'bezocht',empty:'leeg'}[state]}`);
  }
  function redraw() { for (const grid of grids) for (let id = 0; id < size; id++) paint(grid, id); }
  function resetResults() {
    clearTimeout(timer); running = false; runButton.textContent = 'Vergelijk BFS & DFS →';
    for (const grid of grids) {
      grid.visited.clear(); grid.path.clear();
      document.querySelector(`#${grid.name}-result`).textContent = 'Klaar om te zoeken.';
    }
    redraw();
  }
  function edit(id) {
    const tool = document.querySelector('input[name="tool"]:checked').value;
    if ((tool === 'start' && id === end) || (tool === 'end' && id === start)) return;
    resetResults();
    if (tool === 'start') { start = id; walls.delete(id); }
    else if (tool === 'end') { end = id; walls.delete(id); }
    else if (id !== start && id !== end) { if (tool === 'erase') walls.delete(id); else walls.add(id); }
    redraw();
  }
  for (const grid of grids) {
    for (let id = 0; id < size; id++) {
      const cell = document.createElement('button'); cell.type = 'button'; cell.tabIndex = id === start ? 0 : -1; cell.dataset.id = id;
      cell.addEventListener('click', () => edit(id));
      cell.addEventListener('pointerdown', event => {
        if (event.button !== 0) return;
        const tool = document.querySelector('input[name="tool"]:checked').value;
        drawing = tool === 'wall' || tool === 'erase'; lastDrawn = id;
        // Click handles the initial cell, including keyboard activation.
      });
      cell.addEventListener('keydown', event => {
        const delta = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: cols, ArrowUp: -cols }[event.key];
        if (delta === undefined) return;
        event.preventDefault();
        const target = id + delta;
        if (target < 0 || target >= size || (Math.abs(delta) === 1 && Math.floor(target / cols) !== Math.floor(id / cols))) return;
        grid.cells.forEach(c => c.tabIndex = -1); grid.cells[target].tabIndex = 0; grid.cells[target].focus();
      });
      grid.cells.push(cell); grid.el.append(cell);
    }
  }
  document.addEventListener('pointermove', event => {
    if (!drawing) return;
    const cell = document.elementFromPoint(event.clientX, event.clientY)?.closest('.path-cell');
    if (cell && +cell.dataset.id !== lastDrawn) { edit(lastDrawn); lastDrawn = +cell.dataset.id; edit(lastDrawn); }
  });
  document.addEventListener('pointerup', () => { drawing = false; });
  document.addEventListener('pointercancel', () => { drawing = false; });
  window.addEventListener('blur', () => { drawing = false; });
  function search(method) {
    const pending = [start], discovered = new Set([start]), parents = new Map(), order = [];
    let head = 0, found = false;
    while (method === 'bfs' ? head < pending.length : pending.length > 0) {
      const current = method === 'bfs' ? pending[head++] : pending.pop();
      order.push(current);
      if (current === end) { found = true; break; }
      const r = Math.floor(current / cols), c = current % cols;
      const neighbors = [[r,c+1],[r+1,c],[r,c-1],[r-1,c]].filter(([y,x]) => y >= 0 && y < rows && x >= 0 && x < cols).map(([y,x]) => y*cols+x);
      if (method === 'dfs') neighbors.reverse();
      for (const next of neighbors) if (!walls.has(next) && !discovered.has(next)) {
        discovered.add(next); parents.set(next, current); pending.push(next);
      }
    }
    const path = [];
    if (found) for (let node = end; node !== undefined; node = parents.get(node)) path.push(node);
    return { order, path: path.reverse(), found };
  }
  runButton.addEventListener('click', () => {
    if (running) { resetResults(); return; }
    resetResults(); running = true; runButton.textContent = 'Stop zoeken';
    const results = grids.map(grid => search(grid.name));
    let step = 0;
    const delay = Number(document.querySelector('#speed').value);
    const max = Math.max(...results.map(result => result.order.length + result.path.length));
    function tick() {
      const until = delay === 0 ? max : step + 1;
      for (; step < until; step++) grids.forEach((grid, i) => {
        const result = results[i];
        if (step < result.order.length) { const id = result.order[step]; grid.visited.add(id); paint(grid, id); }
        else if (step < result.order.length + result.path.length) { const id = result.path[step-result.order.length]; grid.path.add(id); paint(grid, id); }
        const done = step + 1 >= result.order.length + result.path.length;
        document.querySelector(`#${grid.name}-result`).textContent = done
          ? `${result.found ? `Pad gevonden · ${result.path.length-1} stappen` : 'Geen pad mogelijk'} · ${result.order.length} vakken bezocht.`
          : 'Bezig met zoeken…';
      });
      if (step < max) timer = setTimeout(tick, delay);
      else { running = false; runButton.textContent = 'Vergelijk BFS & DFS →'; }
    }
    tick();
  });
  document.querySelector('#clear-results').addEventListener('click', resetResults);
  document.querySelector('#clear-walls').addEventListener('click', () => { walls.clear(); resetResults(); });
  redraw();
})();
