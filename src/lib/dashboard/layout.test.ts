import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { GRID_COLUMNS } from "./blocks.ts";
import {
  collides,
  defaultLayout,
  matchesDefault,
  normalise,
  parseStoredLayout,
  resolveLayout,
  toStorable,
  type BlockPlacement,
} from "./layout.ts";

// L'agencement est la seule partie de cet écran qu'aucun navigateur ne
// vérifie ici. Un chevauchement résiduel ou une boucle de résolution ne
// se verraient qu'en production, sur le tableau de bord de quelqu'un.

function place(id: string, x: number, y: number, w: number, h: number): BlockPlacement {
  return { id, x, y, w, h, hidden: false };
}

/** Toute paire de blocs, pour vérifier qu'aucune ne se recouvre. */
function anyOverlap(blocks: BlockPlacement[]): [string, string] | null {
  for (let i = 0; i < blocks.length; i += 1) {
    for (let j = i + 1; j < blocks.length; j += 1) {
      if (collides(blocks[i], blocks[j])) return [blocks[i].id, blocks[j].id];
    }
  }
  return null;
}

describe("La résolution des chevauchements", () => {
  test("deux blocs posés au même endroit finissent l'un sous l'autre", () => {
    const result = normalise([place("a", 0, 0, 6, 4), place("b", 0, 0, 6, 4)]);
    assert.equal(anyOverlap(result), null);
  });

  test("le bloc que l'on tient garde exactement sa position", () => {
    const held = place("held", 3, 5, 4, 3);
    const result = normalise([place("a", 0, 0, 12, 6), held], "held");
    const after = result.find((b) => b.id === "held")!;
    assert.equal(after.x, 3);
    assert.equal(after.y, 5);
    assert.equal(anyOverlap(result), null);
  });

  test("les trous se referment : un bloc isolé remonte en haut", () => {
    const result = normalise([place("seul", 0, 40, 4, 3)]);
    assert.equal(result[0].y, 0);
  });

  test("un bloc qui déborde à droite est ramené dans la grille", () => {
    const result = normalise([place("large", 10, 0, 6, 3)]);
    assert.equal(result[0].x, GRID_COLUMNS - 6);
    assert.ok(result[0].x + result[0].w <= GRID_COLUMNS);
  });

  test("vingt blocs empilés au même point ne se chevauchent plus", () => {
    const many = Array.from({ length: 20 }, (_, i) => place(`b${i}`, 0, 0, 4, 3));
    const result = normalise(many);
    assert.equal(result.length, 20);
    assert.equal(anyOverlap(result), null);
  });

  test("la résolution ne boucle pas sur un bloc plus large que la grille", () => {
    // Une largeur aberrante arrivait autrefois d'un arrangement enregistré
    // par une version antérieure. La borne de la boucle existe pour ça.
    const result = normalise([place("monstre", 0, 0, 99, 3), place("b", 0, 0, 4, 3)]);
    assert.equal(result.length, 2);
  });
});

describe("La lecture de ce qui est enregistré", () => {
  test("une entrée illisible est ignorée, pas refusée", () => {
    const parsed = parseStoredLayout([null, 42, "x", { pasDId: true }, { id: "bon", x: 1, y: 2, w: 3, h: 4 }]);
    assert.equal(parsed.length, 1);
    assert.equal(parsed[0].id, "bon");
  });

  test("un doublon d'identifiant ne passe qu'une fois", () => {
    const parsed = parseStoredLayout([{ id: "a", w: 4 }, { id: "a", w: 8 }]);
    assert.equal(parsed.length, 1);
    assert.equal(parsed[0].w, 4);
  });

  test("l'ancienne forme, qui ne connaissait que la largeur, est relue", () => {
    // La première version de cet écran enregistrait { id, span, hidden }.
    const parsed = parseStoredLayout([{ id: "agenda", span: 8, hidden: true }]);
    assert.equal(parsed[0].w, 8);
    assert.equal(parsed[0].hidden, true);
    assert.equal(parsed[0].x, undefined, "sans position : elle sera calculée");
  });

  test("ce qui n'est pas un tableau ne fait pas tomber la page", () => {
    for (const bad of [null, undefined, {}, "[]", 7]) {
      assert.deepEqual(parseStoredLayout(bad), []);
    }
  });
});

describe("La fusion avec les défauts", () => {
  test("l'agencement par défaut ne contient aucun chevauchement", () => {
    const layout = defaultLayout("admin");
    assert.ok(layout.length > 0);
    assert.equal(anyOverlap(layout), null);
    for (const block of layout) {
      assert.ok(block.x >= 0 && block.x + block.w <= GRID_COLUMNS, block.id);
    }
  });

  test("un bloc que l'arrangement ne connaît pas est ajouté, pas perdu", () => {
    const partial = parseStoredLayout([{ id: "agenda", x: 0, y: 0, w: 6, h: 4 }]);
    const layout = resolveLayout("admin", partial);
    assert.equal(layout.length, defaultLayout("admin").length);
    assert.equal(anyOverlap(layout), null);
  });

  test("un bloc qui n'existe plus dans le code est ignoré", () => {
    const stored = parseStoredLayout([{ id: "bloc-supprime-en-2025", x: 0, y: 0, w: 6, h: 4 }]);
    const layout = resolveLayout("admin", stored);
    assert.ok(!layout.some((b) => b.id === "bloc-supprime-en-2025"));
    assert.equal(layout.length, defaultLayout("admin").length);
  });

  test("une largeur sous le minimum est relevée, jamais acceptée", () => {
    const layout = resolveLayout("admin", parseStoredLayout([{ id: "project-table", x: 0, y: 0, w: 1, h: 1 }]));
    const table = layout.find((b) => b.id === "project-table")!;
    assert.ok(table.w >= table.minW);
    assert.ok(table.h >= table.minH);
  });
});

describe("Ce qui repart en base", () => {
  test("seules les six coordonnées sont écrites", () => {
    const stored = toStorable(defaultLayout("admin"));
    for (const entry of stored) {
      assert.deepEqual(Object.keys(entry).sort(), ["h", "hidden", "id", "w", "x", "y"]);
    }
  });

  test("l'arrangement par défaut est reconnu comme tel", () => {
    assert.equal(matchesDefault("admin", defaultLayout("admin")), true);
  });

  test("un seul bloc déplacé suffit à ne plus être le défaut", () => {
    const layout = defaultLayout("admin");
    const moved = layout.map((b, i) => (i === 0 ? { ...b, h: b.h + 2 } : b));
    assert.equal(matchesDefault("admin", moved), false);
  });

  test("un aller-retour base → écran → base ne perd rien", () => {
    const original = defaultLayout("admin");
    const round = resolveLayout("admin", parseStoredLayout(toStorable(original)));
    assert.deepEqual(toStorable(round), toStorable(original));
  });
});
