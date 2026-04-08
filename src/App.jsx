import React, { useMemo, useState } from "react";
import "./styles.css";

const SAMPLE_DATA = [
  {
    id: 1,
    word1: "bars",
    word2: "nors",
    zvw: "streng, hard, onvriendelijk",
    note1: "b-a-rs",
    note2: "n-o-rs",
    confirmationTitle: "OK!",
    confirmationText:
      "Uitgebreide bevestiging komt later vanuit de sheet: lezing, vindplaatsen en vondstinformatie.",
  },
  {
    id: 2,
    word1: "praal",
    word2: "prijk",
    zvw: "zich opvallend tonen, pronken",
    note1: "pr-aa-l",
    note2: "pr-ij-k",
    confirmationTitle: "OK!",
    confirmationText:
      "Uitgebreide bevestiging komt later vanuit de sheet: lezing, vindplaatsen en vondstinformatie.",
  },
  {
    id: 3,
    word1: "zweet",
    word2: "zwoeg",
    zvw: "lichamelijke inspanning, afzien",
    note1: "zw-ee-t",
    note2: "zw-oe-g",
    confirmationTitle: "OK!",
    confirmationText:
      "Uitgebreide bevestiging komt later vanuit de sheet: lezing, vindplaatsen en vondstinformatie.",
  },
  {
    id: 4,
    word1: "fiets",
    word2: "koets",
    zvw: "vervoermiddel op wielen",
    note1: "f-ie-ts",
    note2: "k-oe-ts",
    confirmationTitle: "OK!",
    confirmationText:
      "Uitgebreide bevestiging komt later vanuit de sheet: lezing, vindplaatsen en vondstinformatie.",
  },
];

const VOWEL_WHEEL = ["a", "e", "i", "o", "u", "y", "ij", "aa", "ee", "ie", "oe", "oo", "ui", "uu"];
const CONSONANT_WHEEL = ["b", "c", "d", "f", "g", "h", "j", "k", "l", "m", "n", "p", "q", "r", "s", "t", "v", "w"];

function normalize(value) {
  return (value || "").toLowerCase().trim();
}

function parseNotation(note, fallbackWord = "") {
  if (typeof note === "string") {
    const parts = note
      .split("-")
      .map((part) => normalize(part))
      .filter(Boolean);

    if (parts.length === 3) {
      return { kop: parts[0], romp: parts[1], staart: parts[2] };
    }
  }

  const lowered = normalize(fallbackWord);
  const match = lowered.match(/^([^aeiouy]*)(aa|ee|ie|oe|oo|uu|ui|ij|[aeiouy])(.*)$/i);

  if (!match) {
    return { kop: lowered, romp: "", staart: "" };
  }

  return {
    kop: match[1] || "",
    romp: match[2] || "",
    staart: match[3] || "",
  };
}

function getPartsForWord(item, word) {
  if (normalize(word) === normalize(item.word1)) {
    return parseNotation(item.note1, item.word1);
  }
  if (normalize(word) === normalize(item.word2)) {
    return parseNotation(item.note2, item.word2);
  }
  return parseNotation("", word);
}

function getPartsFromResolution(resolution, kind) {
  if (!resolution) return null;
  if (kind === "source") {
    return parseNotation(resolution.sourceNote, resolution.source || "");
  }
  if (kind === "target") {
    return parseNotation(resolution.targetNote, resolution.target || "");
  }
  return null;
}

function getWheelStartIndex(wheel, value) {
  const index = wheel.findIndex((item) => item === value);
  return index >= 0 ? index : 0;
}

function buildPlayer1Options(pool) {
  const allWords = Array.from(new Set(pool.flatMap((item) => [item.word1, item.word2])));
  return [...allWords].sort((a, b) => a.localeCompare(b, "nl", { sensitivity: "base" }));
}

function buildRound(pool) {
  const item = pool[Math.floor(Math.random() * pool.length)];
  return {
    ...item,
    player1Choice: "",
    player1Options: buildPlayer1Options(pool),
    player2Input: "",
    player1Locked: false,
    showTip: false,
    wheelSlots: { kop: 0, romp: 0, staart: 0 },
    player2Feedback: null,
  };
}

function resolvePlayer1Choice(round, pool = []) {
  const choice = normalize(round.player1Choice);
  const candidates = Array.isArray(pool) && pool.length ? pool : [round];

  const matchedItemSameZ = candidates.find((item) => {
    const sameZ = normalize(item.zvw) === normalize(round.zvw);
    const sameWord = choice === normalize(item.word1) || choice === normalize(item.word2);
    return sameZ && sameWord;
  });

  const matchedItemAnyZ = candidates.find((item) => {
    const sameWord = choice === normalize(item.word1) || choice === normalize(item.word2);
    return sameWord;
  });

  const matchedItem = matchedItemSameZ || matchedItemAnyZ || round;

  if (choice === normalize(matchedItem.word1)) {
    return {
      ok: true,
      item: matchedItem,
      source: matchedItem.word1,
      sourceNote: matchedItem.note1,
      sourceField: "word1",
      target: matchedItem.word2,
      targetNote: matchedItem.note2,
      targetField: "word2",
    };
  }

  if (choice === normalize(matchedItem.word2)) {
    return {
      ok: true,
      item: matchedItem,
      source: matchedItem.word2,
      sourceNote: matchedItem.note2,
      sourceField: "word2",
      target: matchedItem.word1,
      targetNote: matchedItem.note1,
      targetField: "word1",
    };
  }

  return {
    ok: false,
    item: matchedItem,
    source: round.player1Choice,
    sourceNote: "",
    sourceField: null,
    target: null,
    targetNote: "",
    targetField: null,
  };
}

function evaluatePlayer1(round, pool = []) {
  const resolved = resolvePlayer1Choice(round, pool);
  return {
    ok: resolved.ok,
    target: resolved.target,
    source: resolved.source,
    sourceField: resolved.sourceField,
  };
}

function evaluatePlayer2(round, player1Result) {
  if (!player1Result.ok) return { ok: false };
  return { ok: normalize(round.player2Input) === normalize(player1Result.target) };
}

function getActiveAnchor(sourceParts, targetParts) {
  if (!sourceParts || !targetParts) return "none";
  if (sourceParts.kop && sourceParts.kop === targetParts.kop) return "kop";
  if (sourceParts.staart && sourceParts.staart === targetParts.staart) return "staart";
  return "none";
}

function buildWheelLayout(targetParts, activeAnchor, selectedKop, selectedRomp, selectedStaart) {
  if (!targetParts) return [];

  if (activeAnchor === "kop") {
    return [
      { type: "anchor", label: "kop (anker)", value: targetParts.kop, anchor: true },
      { type: "romp", label: "romp", value: selectedRomp, wide: true },
      { type: "staart", label: "staart", value: selectedStaart },
    ];
  }

  if (activeAnchor === "staart") {
    return [
      { type: "kop", label: "kop", value: selectedKop },
      { type: "romp", label: "romp", value: selectedRomp, wide: true },
      { type: "anchor", label: "staart (anker)", value: targetParts.staart, anchor: true },
    ];
  }

  return [
    { type: "kop", label: "kop", value: selectedKop },
    { type: "romp", label: "romp", value: selectedRomp, wide: true },
    { type: "staart", label: "staart", value: selectedStaart },
  ];
}

function runInternalTests() {
  return [
    {
      name: "parseNotation leest f-ie-ts correct",
      pass:
        JSON.stringify(parseNotation("f-ie-ts")) ===
        JSON.stringify({ kop: "f", romp: "ie", staart: "ts" }),
    },
    {
      name: "parseNotation leest zw-oe-g correct",
      pass:
        JSON.stringify(parseNotation("zw-oe-g")) ===
        JSON.stringify({ kop: "zw", romp: "oe", staart: "g" }),
    },
    {
      name: "actief anker bars/nors is staart",
      pass:
        getActiveAnchor(
          { kop: "b", romp: "a", staart: "rs" },
          { kop: "n", romp: "o", staart: "rs" }
        ) === "staart",
    },
    {
      name: "actief anker zweet/zwoeg is kop",
      pass:
        getActiveAnchor(
          { kop: "zw", romp: "ee", staart: "t" },
          { kop: "zw", romp: "oe", staart: "g" }
        ) === "kop",
    },
    {
      name: "wheellayout gebruikt apart staartwiel bij kop-anker",
      pass:
        JSON.stringify(buildWheelLayout({ kop: "zw", romp: "oe", staart: "g" }, "kop", "b", "ee", "t")) ===
        JSON.stringify([
          { type: "anchor", label: "kop (anker)", value: "zw", anchor: true },
          { type: "romp", label: "romp", value: "ee", wide: true },
          { type: "staart", label: "staart", value: "t" },
        ]),
    },
    {
      name: "speler 1 opties bevatten beide juiste woorden",
      pass: (() => {
        const options = buildPlayer1Options(SAMPLE_DATA);
        return options.includes("fiets") && options.includes("koets");
      })(),
    },
    {
      name: "speler 1 opties zijn alfabetisch gesorteerd",
      pass: (() => {
        const options = buildPlayer1Options(SAMPLE_DATA);
        const sorted = [...options].sort((a, b) => a.localeCompare(b, "nl", { sensitivity: "base" }));
        return JSON.stringify(options) === JSON.stringify(sorted);
      })(),
    },
    {
      name: "speler 1 opties bevatten alle unieke woorden",
      pass: (() => {
        const options = buildPlayer1Options(SAMPLE_DATA);
        const expected = ["bars", "fiets", "koets", "nors", "praal", "prijk", "zweet", "zwoeg"];
        return JSON.stringify(options) === JSON.stringify(expected);
      })(),
    },
    {
      name: "keuze op word2 start met word2 als W1",
      pass: (() => {
        const resolved = resolvePlayer1Choice({ ...SAMPLE_DATA[0], player1Choice: "nors" }, SAMPLE_DATA);
        return resolved.ok && resolved.source === "nors" && resolved.target === "bars" && resolved.sourceField === "word2";
      })(),
    },
    {
      name: "keuze prijk binnen dezelfde zinverwantschap is geldig",
      pass: (() => {
        const round = { ...SAMPLE_DATA[1], player1Choice: "prijk" };
        const resolved = resolvePlayer1Choice(round, SAMPLE_DATA);
        return resolved.ok && resolved.source === "prijk" && resolved.target === "praal";
      })(),
    },
    {
      name: "keuze nors is geldig en leidt naar bars",
      pass: (() => {
        const round = { ...SAMPLE_DATA[0], player1Choice: "nors" };
        const resolved = resolvePlayer1Choice(round, SAMPLE_DATA);
        return resolved.ok && resolved.source === "nors" && resolved.target === "bars";
      })(),
    },
    {
      name: "targetParts gebruikt note1/note2 van opgeloste keuze",
      pass: (() => {
        const round = { ...SAMPLE_DATA[1], player1Choice: "prijk" };
        const resolved = resolvePlayer1Choice(round, SAMPLE_DATA);
        const targetParts = getPartsFromResolution(resolved, "target");
        return JSON.stringify(targetParts) === JSON.stringify({ kop: "pr", romp: "aa", staart: "l" });
      })(),
    },
    {
      name: "start van S2 vult correcte doelwoordvorm vooraf in",
      pass: (() => {
        const resolved = resolvePlayer1Choice({ ...SAMPLE_DATA[0], player1Choice: "nors" }, SAMPLE_DATA);
        const sourceParts = getPartsFromResolution(resolved, "source");
        const targetParts = getPartsFromResolution(resolved, "target");
        const activeAnchor = getActiveAnchor(sourceParts, targetParts);
        const wheelSlots = {
          kop: getWheelStartIndex(CONSONANT_WHEEL, targetParts?.kop || ""),
          romp: getWheelStartIndex(VOWEL_WHEEL, targetParts?.romp || ""),
          staart: getWheelStartIndex(CONSONANT_WHEEL, targetParts?.staart || ""),
        };
        const layout = buildWheelLayout(
          targetParts,
          activeAnchor,
          CONSONANT_WHEEL[wheelSlots.kop] || "",
          VOWEL_WHEEL[wheelSlots.romp] || "",
          CONSONANT_WHEEL[wheelSlots.staart] || ""
        );
        return layout.map((slot) => slot.value || "").join("") === "bars";
      })(),
    },
  ];
}

function WheelSlot({ label, value, onPrev, onNext, disabled = false, anchor = false, wide = false }) {
  return (
    <div className={`wheel-slot ${anchor ? "wheel-slot-anchor" : ""} ${wide ? "wheel-slot-wide" : ""}`}>
      <div className="wheel-slot-label">{label}</div>
      {anchor ? (
        <div className="wheel-slot-value wheel-slot-value-anchor">{value || "—"}</div>
      ) : (
        <div className="wheel-slot-controls">
          <button type="button" className="icon-button" onClick={onPrev} disabled={disabled} aria-label={`${label} omlaag`}>
            ▼
          </button>
          <div className="wheel-slot-value">{value || "—"}</div>
          <button type="button" className="icon-button" onClick={onNext} disabled={disabled} aria-label={`${label} omhoog`}>
            ▲
          </button>
        </div>
      )}
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <h2>{title}</h2>
      </div>
      <div className="panel-body">{children}</div>
    </section>
  );
}

function ActionButton({ children, variant = "primary", className = "", ...props }) {
  return (
    <button type="button" className={`button button-${variant} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}

export default function App() {
  const [rawData, setRawData] = useState(JSON.stringify(SAMPLE_DATA, null, 2));
  const [data, setData] = useState(SAMPLE_DATA);
  const [round, setRound] = useState(() => buildRound(SAMPLE_DATA));
  const [importError, setImportError] = useState("");

  const player1Resolution = useMemo(() => resolvePlayer1Choice(round, data), [round, data]);
  const player1Result = useMemo(() => evaluatePlayer1(round, data), [round, data]);

  const sourceParts = useMemo(() => {
    if (!player1Resolution.ok) {
      return getPartsForWord(round, round.player1Choice);
    }
    return getPartsFromResolution(player1Resolution, "source");
  }, [round, player1Resolution]);

  const targetParts = useMemo(() => {
    if (!player1Resolution.ok || !player1Resolution.target) {
      return null;
    }
    return getPartsFromResolution(player1Resolution, "target");
  }, [player1Resolution]);

  const activeAnchor = useMemo(() => getActiveAnchor(sourceParts, targetParts), [sourceParts, targetParts]);
  const selectedKop = CONSONANT_WHEEL[round.wheelSlots.kop] || "";
  const selectedRomp = VOWEL_WHEEL[round.wheelSlots.romp] || "";
  const selectedStaart = CONSONANT_WHEEL[round.wheelSlots.staart] || "";

  const wheelLayout = useMemo(
    () => buildWheelLayout(targetParts, activeAnchor, selectedKop, selectedRomp, selectedStaart),
    [targetParts, activeAnchor, selectedKop, selectedRomp, selectedStaart]
  );

  const internalTests = useMemo(() => runInternalTests(), []);

  function newRound(pool = data) {
    setRound(buildRound(pool));
  }

  function lockPlayer1() {
    if (!round.player1Choice) return;

    const resolved = resolvePlayer1Choice(round, data);
    const targetPartsLocal = resolved.ok && resolved.target ? getPartsFromResolution(resolved, "target") : null;
    const sourcePartsLocal = resolved.ok
      ? getPartsFromResolution(resolved, "source")
      : getPartsForWord(round, round.player1Choice);
    const activeAnchorLocal = getActiveAnchor(sourcePartsLocal, targetPartsLocal);

    const nextWheelSlots = {
      kop: getWheelStartIndex(CONSONANT_WHEEL, targetPartsLocal?.kop || ""),
      romp: getWheelStartIndex(VOWEL_WHEEL, targetPartsLocal?.romp || ""),
      staart: getWheelStartIndex(CONSONANT_WHEEL, targetPartsLocal?.staart || ""),
    };

    const initialWheelLayout = buildWheelLayout(
      targetPartsLocal,
      activeAnchorLocal,
      CONSONANT_WHEEL[nextWheelSlots.kop] || "",
      VOWEL_WHEEL[nextWheelSlots.romp] || "",
      CONSONANT_WHEEL[nextWheelSlots.staart] || ""
    );

    const initialPlayer2Input = initialWheelLayout.map((slot) => slot.value || "").join("");

    setRound((current) => ({
      ...current,
      player1Locked: true,
      showTip: false,
      player2Input: initialPlayer2Input,
      wheelSlots: nextWheelSlots,
      player2Feedback: null,
    }));
  }

  function lockPlayer2() {
    if (!round.player2Input) return;
    const result = evaluatePlayer2(round, player1Result);
    setRound((current) => ({ ...current, player2Feedback: result.ok ? "correct" : "wrong" }));
  }

  function importJson() {
    try {
      const parsed = JSON.parse(rawData);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error("De JSON moet een niet-lege array zijn.");
      }
      setData(parsed);
      setRound(buildRound(parsed));
      setImportError("");
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "Ongeldige JSON");
    }
  }

  function backspacePlayer2() {
    setRound((current) => ({
      ...current,
      player2Input: current.player2Input.slice(0, -1),
      player2Feedback: null,
    }));
  }

  function clearPlayer2() {
    setRound((current) => ({ ...current, player2Input: "", player2Feedback: null }));
  }

  function cycleWheel(type, direction) {
    const wheel = type === "romp" ? VOWEL_WHEEL : CONSONANT_WHEEL;

    setRound((current) => {
      const nextIndex = (current.wheelSlots[type] + direction + wheel.length) % wheel.length;
      const nextWheelSlots = { ...current.wheelSlots, [type]: nextIndex };

      const nextSelectedKop = CONSONANT_WHEEL[nextWheelSlots.kop] || "";
      const nextSelectedRomp = VOWEL_WHEEL[nextWheelSlots.romp] || "";
      const nextSelectedStaart = CONSONANT_WHEEL[nextWheelSlots.staart] || "";

      const nextResolution = resolvePlayer1Choice(current, data);
      const nextTargetParts = nextResolution.ok && nextResolution.target ? getPartsFromResolution(nextResolution, "target") : null;
      const nextSourceParts = nextResolution.ok
        ? getPartsFromResolution(nextResolution, "source")
        : getPartsForWord(current, current.player1Choice);
      const nextActiveAnchor = getActiveAnchor(nextSourceParts, nextTargetParts);
      const nextWheelLayout = buildWheelLayout(
        nextTargetParts,
        nextActiveAnchor,
        nextSelectedKop,
        nextSelectedRomp,
        nextSelectedStaart
      );
      const nextPlayer2Input = nextWheelLayout.map((slot) => slot.value || "").join("");

      return {
        ...current,
        wheelSlots: nextWheelSlots,
        player2Input: nextPlayer2Input,
        player2Feedback: null,
      };
    });
  }

  function handlePlayer2InputChange(value) {
    setRound((current) => ({ ...current, player2Input: value, player2Feedback: null }));
  }

  return (
    <div className="app-shell">
      <div className="app-grid">
        <main className="main-column">
          <Panel title="Zinverwantschapspel">
            <div className="game-layout">
              <section className="player-column">
                <h3>Speler 1</h3>
                <div className="stack-list">
                  {round.player1Options.map((word) => (
                    <ActionButton
                      key={word}
                      variant={round.player1Choice === word ? "primary" : "secondary"}
                      disabled={round.player1Locked}
                      onClick={() => setRound((current) => ({ ...current, player1Choice: word }))}
                      className="full-width"
                    >
                      {word}
                    </ActionButton>
                  ))}
                </div>
                <ActionButton onClick={lockPlayer1} disabled={!round.player1Choice} className="confirm-button">
                  Bevestig
                </ActionButton>
              </section>

              <section className="meaning-card">
                <div className="meaning-label">Zinverwantschap</div>
                <div className="meaning-text">{round.zvw}</div>
              </section>

              <section className="player-column player-two-column">
                <h3>Speler 2</h3>

                <div className="field-label">W1</div>
                <div className="word-display">
                  {round.player1Locked
                    ? player1Resolution.ok
                      ? player1Resolution.source
                      : round.player1Choice || "-"
                    : "-"}
                </div>

                {!round.showTip && round.player1Locked && (
                  <ActionButton variant="secondary" onClick={() => setRound((current) => ({ ...current, showTip: true }))}>
                    Toon tip
                  </ActionButton>
                )}

                {round.showTip && round.player1Locked && (
                  <div className="tip-box">
                    {targetParts ? (
                      <>
                        <div>
                          <strong>Kop-romp-staart:</strong>
                          <div className="mono-large">
                            {[sourceParts.kop, sourceParts.romp, sourceParts.staart].filter(Boolean).join("-")}
                          </div>
                        </div>
                        <div>
                          <strong>Actief anker:</strong>
                          <div className="mono-large">
                            {activeAnchor === "kop"
                              ? `kop: ${targetParts.kop || "—"}`
                              : activeAnchor === "staart"
                                ? `staart: ${targetParts.staart || "—"}`
                                : "—"}
                          </div>
                        </div>
                        <div className="muted-text">
                          De romp komt uit de sheetnotatie en gebruikt altijd de maximale lettergroep, zoals <code>ie</code> in <code>f-ie-ts</code> en <code>oe</code> in <code>zw-oe-g</code>.
                        </div>
                      </>
                    ) : (
                      <div className="muted-text">
                        Kies in W1 één van de twee woorden die echt bij deze zinverwantschap horen. Daarna verschijnen tip en wielvenster stabiel.
                      </div>
                    )}
                  </div>
                )}

                <div className="player-two-controls">
                  <input
                    className="text-input"
                    placeholder="raad woord"
                    disabled={!round.player1Locked}
                    value={round.player2Input}
                    onChange={(event) => handlePlayer2InputChange(event.target.value)}
                  />

                  {round.player1Locked && (
                    <div className="edit-window">
                      <div className="edit-window-title">Editwindow</div>
                      {targetParts ? (
                        <div className="wheel-grid">
                          {wheelLayout.map((slot, index) => (
                            <WheelSlot
                              key={`${slot.type}-${index}`}
                              label={slot.label}
                              value={slot.value}
                              onPrev={slot.anchor ? undefined : () => cycleWheel(slot.type, -1)}
                              onNext={slot.anchor ? undefined : () => cycleWheel(slot.type, 1)}
                              disabled={!round.player1Locked}
                              wide={slot.wide}
                              anchor={slot.anchor}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="warning-text">Wielvenster wacht op een geldige W1-keuze.</div>
                      )}
                    </div>
                  )}

                  <div className="button-row">
                    <ActionButton
                      variant="secondary"
                      onClick={backspacePlayer2}
                      disabled={!round.player1Locked || !round.player2Input}
                    >
                      Wis laatste
                    </ActionButton>
                    <ActionButton
                      variant="secondary"
                      onClick={clearPlayer2}
                      disabled={!round.player1Locked || !round.player2Input}
                    >
                      Leeg
                    </ActionButton>
                    <ActionButton
                      onClick={lockPlayer2}
                      disabled={!round.player1Locked || !round.player2Input.trim()}
                    >
                      Bevestig
                    </ActionButton>
                  </div>

                  {round.player2Feedback === "correct" && (
                    <div className="feedback feedback-correct">
                      <div className="feedback-title">
                        {player1Result.target} + {player1Resolution.ok ? player1Resolution.source : round.player1Choice} {round.confirmationTitle || "OK!"}
                      </div>
                      <div className="feedback-text">
                        {round.confirmationText || "Uitgebreide bevestiging komt later vanuit de sheet."}
                      </div>
                    </div>
                  )}

                  {round.player2Feedback === "wrong" && (
                    <div className="feedback feedback-wrong">Fout. Je kunt direct verder draaien of typen.</div>
                  )}
                </div>
              </section>
            </div>
          </Panel>
        </main>

        <aside className="side-column">
          <Panel title="Data">
            <div className="stack-gap">
              <textarea
                value={rawData}
                onChange={(event) => setRawData(event.target.value)}
                className="data-textarea"
              />
              {importError ? <div className="error-text">{importError}</div> : null}
              <div className="button-row">
                <ActionButton onClick={importJson}>Import</ActionButton>
                <ActionButton variant="secondary" onClick={() => newRound()}>
                  Nieuwe ronde
                </ActionButton>
              </div>
            </div>
          </Panel>

          <Panel title="Interne tests">
            <div className="tests-list">
              {internalTests.map((test) => (
                <div key={test.name} className={`test-item ${test.pass ? "test-item-pass" : "test-item-fail"}`}>
                  <strong>{test.pass ? "OK" : "FOUT"}</strong>: {test.name}
                </div>
              ))}
            </div>
          </Panel>
        </aside>
      </div>
    </div>
  );
}
