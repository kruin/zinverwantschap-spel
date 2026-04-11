import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Delete } from "lucide-react";

const SAMPLE_DATA = [
  { id: 1, word1: "bars", word2: "nors", zvw: "streng, hard, onvriendelijk", note1: "b-a-rs", note2: "n-o-rs" },
  { id: 2, word1: "praal", word2: "prijk", zvw: "zich opvallend tonen, pronken", note1: "pr-aa-l", note2: "pr-ij-k" },
  { id: 3, word1: "zweet", word2: "zwoeg", zvw: "lichamelijke inspanning, afzien", note1: "zw-ee-t", note2: "zw-oe-g" },
  { id: 4, word1: "fiets", word2: "koets", zvw: "vervoermiddel op wielen", note1: "f-ie-ts", note2: "k-oe-ts" },
];

const VOWEL_WHEEL = ["a", "e", "i", "o", "u", "y", "ij", "aa", "ee", "ie", "oe", "oo", "ui", "uu"];
const CONSONANT_WHEEL = ["b", "c", "d", "f", "g", "h", "j", "k", "l", "m", "n", "p", "q", "r", "s", "t", "v", "w", "z", "zw", "pr"];

const normalize = (s) => (s || "").toLowerCase().trim();

function parseNotation(note) {
  if (note?.includes("-")) {
    const [kop, romp, staart] = note.split("-");
    return { kop, romp, staart };
  }
  return { kop: "", romp: "", staart: "" };
}

function resolve(round, data) {
  const c = normalize(round.player1Choice);
  const item = data.find((d) => c === d.word1 || c === d.word2);
  if (!item) return { ok: false };

  return {
    ok: true,
    source: c === item.word1 ? item.word1 : item.word2,
    target: c === item.word1 ? item.word2 : item.word1,
    sourceNote: c === item.word1 ? item.note1 : item.note2,
    targetNote: c === item.word1 ? item.note2 : item.note1,
    zvw: item.zvw,
  };
}

function buildRound() {
  return {
    player1Choice: "",
    player1Locked: false,
    player2Input: "",
    attempts: 0,
    max: 3,
    solved: false,
    showTip: false,
    wheelSlots: { kop: 0, romp: 0, staart: 0 },
  };
}

function buildOptions(data) {
  return [...new Set(data.flatMap((d) => [d.word1, d.word2]))].sort((a, b) =>
    a.localeCompare(b, "nl", { sensitivity: "base" })
  );
}

function getActiveAnchor(source, target) {
  if (source.kop && source.kop === target.kop) return "kop";
  if (source.staart && source.staart === target.staart) return "staart";
  return "none";
}

function getFilteredWheel(wheel, targetValue, attempts) {
  if (attempts < 2) return wheel;
  if (!targetValue) return wheel;
  const filtered = wheel.filter((item) => item === targetValue);
  return filtered.length ? filtered : wheel;
}

function WheelSlot({
  label,
  value,
  onPrev,
  onNext,
  anchor = false,
  disabled = false,
}) {
  return (
    <div className={`rounded-xl border p-3 ${anchor ? "border-2 border-slate-900 bg-slate-100" : "bg-white"}`}>
      <div className="mb-2 text-center text-xs text-slate-500">{label}</div>
      {anchor ? (
        <div className="flex min-h-[48px] items-center justify-center font-mono text-xl font-semibold">{value || "—"}</div>
      ) : (
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={onPrev}
            disabled={disabled}
            className="rounded-lg border p-2 hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
          <div className="min-w-[3.5rem] text-center font-mono text-xl font-semibold">{value || "—"}</div>
          <button
            type="button"
            onClick={onNext}
            disabled={disabled}
            className="rounded-lg border p-2 hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ChevronUp className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [data] = useState(SAMPLE_DATA);
  const [round, setRound] = useState(() => buildRound());
  const [showExample, setShowExample] = useState(false);

  const res = useMemo(() => resolve(round, data), [round, data]);
  const source = useMemo(() => parseNotation(res.sourceNote), [res.sourceNote]);
  const target = useMemo(() => parseNotation(res.targetNote), [res.targetNote]);
  const options = useMemo(() => buildOptions(data), [data]);

  const selectedItem = useMemo(() => {
    const choice = normalize(round.player1Choice);
    return data.find((d) => choice === d.word1 || choice === d.word2) || null;
  }, [round.player1Choice, data]);

  const currentZvw = selectedItem?.zvw || "";

  const activeAnchor = useMemo(() => {
    if (!res.ok) return "none";
    return getActiveAnchor(source, target);
  }, [res.ok, source, target]);

  const kopWheel = useMemo(() => {
    if (activeAnchor === "kop") return [target.kop];
    return getFilteredWheel(CONSONANT_WHEEL, target.kop, round.attempts);
  }, [activeAnchor, target.kop, round.attempts]);

  const rompWheel = useMemo(() => getFilteredWheel(VOWEL_WHEEL, target.romp, round.attempts), [target.romp, round.attempts]);

  const staartWheel = useMemo(() => {
    if (activeAnchor === "staart") return [target.staart];
    return getFilteredWheel(CONSONANT_WHEEL, target.staart, round.attempts);
  }, [activeAnchor, target.staart, round.attempts]);

  const selectedKop = kopWheel[round.wheelSlots.kop] || kopWheel[0] || "";
  const selectedRomp = rompWheel[round.wheelSlots.romp] || rompWheel[0] || "";
  const selectedStaart = staartWheel[round.wheelSlots.staart] || staartWheel[0] || "";

  function buildWordFromWheels(nextWheelSlots = round.wheelSlots) {
    if (!res.ok) return "";
    const kopValue = kopWheel[nextWheelSlots.kop] || kopWheel[0] || "";
    const rompValue = rompWheel[nextWheelSlots.romp] || rompWheel[0] || "";
    const staartValue = staartWheel[nextWheelSlots.staart] || staartWheel[0] || "";

    if (activeAnchor === "kop") return `${target.kop}${rompValue}${staartValue}`;
    if (activeAnchor === "staart") return `${kopValue}${rompValue}${target.staart}`;
    return `${kopValue}${rompValue}${staartValue}`;
  }

  function getAttemptWord() {
    const typed = normalize(round.player2Input);
    if (typed) return typed;
    return normalize(buildWordFromWheels());
  }

  function loadExample() {
    setShowExample(true);
    setRound({
      player1Choice: "fiets",
      player1Locked: true,
      player2Input: "",
      attempts: 0,
      max: 3,
      solved: false,
      showTip: false,
      wheelSlots: { kop: 0, romp: 0, staart: 0 },
    });
  }

  function resetRound() {
    setShowExample(false);
    setRound(buildRound());
  }

  function confirmS1() {
    if (!round.player1Choice) return;

    setShowExample(false);
    setRound((r) => ({
      ...r,
      player1Locked: true,
      attempts: 0,
      player2Input: "",
      showTip: false,
      wheelSlots: { kop: 0, romp: 0, staart: 0 },
      solved: false,
    }));
  }

  function confirmS2() {
    if (!res.ok) return;

    const attemptWord = getAttemptWord();
    if (!attemptWord) return;

    if (attemptWord === normalize(res.target)) {
      setRound((r) => ({
        ...r,
        player2Input: buildWordFromWheels() || r.player2Input || res.target,
        solved: true,
      }));
      return;
    }

    if (round.attempts + 1 >= round.max) {
      resetRound();
      return;
    }

    setRound((r) => {
      const nextAttempts = r.attempts + 1;
      const nextWheelSlots = {
        kop: Math.min(r.wheelSlots.kop, Math.max(kopWheel.length - 1, 0)),
        romp: Math.min(r.wheelSlots.romp, Math.max(rompWheel.length - 1, 0)),
        staart: Math.min(r.wheelSlots.staart, Math.max(staartWheel.length - 1, 0)),
      };
      return {
        ...r,
        attempts: nextAttempts,
        showTip: true,
        wheelSlots: nextWheelSlots,
        player2Input: r.player2Input || buildWordFromWheels(nextWheelSlots),
      };
    });
  }

  function cycleWheel(type, direction) {
    const wheel = type === "kop" ? kopWheel : type === "romp" ? rompWheel : staartWheel;
    if (wheel.length <= 1) return;

    setShowExample(false);
    setRound((r) => {
      const current = r.wheelSlots[type];
      const nextIndex = (current + direction + wheel.length) % wheel.length;
      const nextWheelSlots = { ...r.wheelSlots, [type]: nextIndex };
      return {
        ...r,
        wheelSlots: nextWheelSlots,
        player2Input: buildWordFromWheels(nextWheelSlots),
      };
    });
  }

  function renderTip() {
    if (!round.player1Locked || !res.ok) return null;
    if (round.attempts === 0) return null;

    if (round.attempts === 1) {
      return (
        <div className="rounded-xl border bg-slate-50 p-3 text-sm">
          <strong>Kop · Romp · Staart:</strong> {source.kop} - {source.romp} - {source.staart}
        </div>
      );
    }

    if (round.attempts === 2) {
      return (
        <div className="rounded-xl border bg-slate-50 p-3 text-sm space-y-1">
          <div><strong>Anker:</strong> {activeAnchor}</div>
          <div className="text-slate-600">Vanaf nu worden de wielen beperkt door de tips.</div>
        </div>
      );
    }

    return (
      <div className="rounded-xl border bg-slate-50 p-3 text-sm">
        <strong>Romp-hint:</strong> {target.romp}
      </div>
    );
  }

  function renderKrsView() {
    if (!round.player1Locked || !res.ok) return null;

    return (
      <div className="rounded-xl border bg-slate-50 p-4">
        <div className="mb-3 text-sm font-medium">Kop · Romp · Staart van W1</div>
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border bg-white p-3 text-center">
            <div className="text-xs text-slate-500">Kop</div>
            <div className="mt-1 font-mono text-xl font-semibold">{source.kop || "—"}</div>
          </div>
          <div className="rounded-lg border bg-white p-3 text-center">
            <div className="text-xs text-slate-500">Romp</div>
            <div className="mt-1 font-mono text-xl font-semibold">{source.romp || "—"}</div>
          </div>
          <div className="rounded-lg border bg-white p-3 text-center">
            <div className="text-xs text-slate-500">Staart</div>
            <div className="mt-1 font-mono text-xl font-semibold">{source.staart || "—"}</div>
          </div>
        </div>
      </div>
    );
  }

  function renderExampleBlock() {
    if (!showExample || !res.ok) return null;

    return (
      <div className="rounded-2xl border border-blue-300 bg-blue-50 p-4 text-sm space-y-2">
        <div className="font-semibold">Voorbeeld-run</div>
        <div>1. S1 kiest <strong>{res.source}</strong>.</div>
        <div>2. Z wordt <strong>{res.zvw}</strong>.</div>
        <div>3. S2 ziet W1 = <strong>{res.source}</strong> en KRS = <strong>{source.kop} · {source.romp} · {source.staart}</strong>.</div>
        <div>4. S2 redeneert naar <strong>{target.kop} · {target.romp} · {target.staart}</strong>.</div>
        <div>5. Doelwoord: <strong>{res.target}</strong>.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-5xl">
        <Card className="rounded-2xl shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle className="text-2xl">Zinverwantschapspel</CardTitle>
            <Button variant="outline" onClick={loadExample}>
              Voorbeeld
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {renderExampleBlock()}

            <div className="w-full">
              <h3 className="mb-3 text-lg font-medium">S1</h3>
              <div className="rounded-xl border bg-white p-4 text-lg leading-8">
                {options.map((w, i) => {
                  const selected = round.player1Choice === w;
                  return (
                    <React.Fragment key={w}>
                      <button
                        type="button"
                        onClick={() => {
                          setShowExample(false);
                          setRound((r) => ({
                            ...r,
                            player1Choice: w,
                          }));
                        }}
                        disabled={round.player1Locked}
                        className={`inline bg-transparent p-0 ${selected ? "font-bold underline" : "font-normal"} ${
                          round.player1Locked ? "cursor-default opacity-70" : "cursor-pointer"
                        }`}
                      >
                        {w}
                      </button>
                      {i < options.length - 1 ? " - " : ""}
                    </React.Fragment>
                  );
                })}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button onClick={confirmS1} disabled={!round.player1Choice || round.player1Locked}>
                  Bevestig
                </Button>
                <Button variant="outline" onClick={resetRound}>
                  Reset
                </Button>
              </div>
            </div>

            <div className="w-full rounded-2xl border-2 border-slate-900 bg-white p-6 text-center">
              <div className="text-sm text-slate-500">Z</div>
              <div className="mt-2 text-2xl font-semibold">{currentZvw || "-"}</div>
            </div>

            <div className="w-full border-t pt-6">
              <h3 className="mb-3 text-lg font-medium">S2</h3>
              <div className="mb-2 text-sm text-slate-500">W1</div>
              <div className="mb-4 text-lg font-bold">{round.player1Locked ? res.source : "-"}</div>

              {renderKrsView()}

              <div className="mt-4 mb-4">{renderTip()}</div>

              <div className="space-y-4">
                <input
                  value={round.player2Input}
                  onChange={(e) => {
                    setShowExample(false);
                    setRound((r) => ({ ...r, player2Input: e.target.value }));
                  }}
                  disabled={!round.player1Locked || round.solved}
                  placeholder="raad woord"
                  className="w-full rounded-xl border bg-white p-3 text-lg"
                />

                {round.player1Locked && res.ok && (
                  <div className="rounded-xl border p-4">
                    <div className="mb-3 text-sm font-medium">Woordwielen</div>
                    <div className="grid grid-cols-3 gap-3">
                      <WheelSlot
                        label={activeAnchor === "kop" ? "Kop (anker)" : "Kop"}
                        value={activeAnchor === "kop" ? target.kop : selectedKop}
                        anchor={activeAnchor === "kop"}
                        disabled={round.solved || activeAnchor === "kop" || kopWheel.length <= 1}
                        onPrev={activeAnchor === "kop" ? undefined : () => cycleWheel("kop", -1)}
                        onNext={activeAnchor === "kop" ? undefined : () => cycleWheel("kop", 1)}
                      />
                      <WheelSlot
                        label="Romp"
                        value={selectedRomp}
                        disabled={round.solved || rompWheel.length <= 1}
                        onPrev={() => cycleWheel("romp", -1)}
                        onNext={() => cycleWheel("romp", 1)}
                      />
                      <WheelSlot
                        label={activeAnchor === "staart" ? "Staart (anker)" : "Staart"}
                        value={activeAnchor === "staart" ? target.staart : selectedStaart}
                        anchor={activeAnchor === "staart"}
                        disabled={round.solved || activeAnchor === "staart" || staartWheel.length <= 1}
                        onPrev={activeAnchor === "staart" ? undefined : () => cycleWheel("staart", -1)}
                        onNext={activeAnchor === "staart" ? undefined : () => cycleWheel("staart", 1)}
                      />
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setRound((r) => ({ ...r, player2Input: r.player2Input.slice(0, -1) }))}
                    disabled={!round.player1Locked || !round.player2Input || round.solved}
                  >
                    <Delete className="mr-2 h-4 w-4" /> Wis laatste
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setRound((r) => ({ ...r, player2Input: "" }))}
                    disabled={!round.player1Locked || !round.player2Input || round.solved}
                  >
                    Leeg
                  </Button>
                  <Button onClick={confirmS2} disabled={!round.player1Locked || round.solved}>
                    Bevestig
                  </Button>
                </div>

                <div className="text-sm text-slate-600">Pogingen: {round.attempts}/{round.max}</div>

                {round.solved && (
                  <div className="rounded-xl border border-green-300 bg-green-50 p-4">
                    <div className="font-semibold">OK: {res.target} + {res.source}</div>
                    <div className="mt-3">
                      <Button onClick={resetRound}>Volgende ronde</Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}