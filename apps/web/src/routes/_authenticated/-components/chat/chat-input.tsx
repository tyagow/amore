import {
  useCallback,
  useRef,
  useEffect,
  useState,
  type KeyboardEvent,
} from "react";
import { buildRepairDraft } from "./repair-draft";
import { buildPauseBeforeSendDraft } from "./pause-draft";
import { buildNeedDraft } from "./need-draft";
import { buildSofterStartDraft } from "./soften-draft";
import { buildAppreciationDraft } from "./appreciation-draft";
import { buildApologyDraft } from "./apology-draft";
import { buildConflictMapDraft } from "./conflict-map-draft";
import { buildSpaceDraft } from "./space-draft";
import { buildFollowUpDraft } from "./follow-up-draft";
import { buildCoachReviewPrompt } from "./coach-review-prompt";
import { getHeatedDraftWarning } from "./heated-draft";
import { buildBidRepairDraft } from "./bid-repair-draft";
import { buildGoalDraftFromChatDraft } from "./chat-goal-draft";
import { buildAftercareDraft } from "./aftercare-draft";
import { buildListenFirstDraft } from "./listen-draft";
import { buildLongingDraft } from "./longing-draft";
import { getStarters } from "./starter-drafts";
import {
  buildDraftReadyForSend,
  buildDraftWithClearAsk,
  buildDraftWithOwnership,
  buildDraftWithRoomForNo,
  buildDraftWithSpecificMoment,
  buildDraftWithWarmth,
  getDraftCareChecks,
  prepareDraftForSend,
} from "./draft-care-check";
import { useI18n } from "~/lib/i18n";
import {
  consumeStoredChatDraft,
  storeGoalDraft,
} from "~/lib/chat-draft-storage";
type ChatGuide =
  | "repair"
  | "need"
  | "appreciation"
  | "apology"
  | "conflict"
  | "space"
  | "bid"
  | "aftercare"
  | "listen"
  | "longing";

type ComposerMode = "write" | "improve" | "guide";

const COMPOSER_MODES = ["write", "improve", "guide"] as const;

export function ChatInput({
  onSend,
  onReview,
  disabled,
  reviewLoading,
  inputText,
  setInputText,
}: {
  onSend: (text: string) => void;
  onReview: (text: string) => void;
  disabled: boolean;
  reviewLoading: boolean;
  inputText: string;
  setInputText: (text: string) => void;
}) {
  const { locale, t } = useI18n();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [composerMode, setComposerMode] = useState<ComposerMode>("write");
  const [showRepairBuilder, setShowRepairBuilder] = useState(false);
  const [repairFeeling, setRepairFeeling] = useState("");
  const [repairOwnership, setRepairOwnership] = useState("");
  const [repairNeed, setRepairNeed] = useState("");
  const [repairRequest, setRepairRequest] = useState("");
  const [showNeedBuilder, setShowNeedBuilder] = useState(false);
  const [needValue, setNeedValue] = useState("");
  const [needWhy, setNeedWhy] = useState("");
  const [needRequest, setNeedRequest] = useState("");
  const [needFlexibility, setNeedFlexibility] = useState("");
  const [showAppreciationBuilder, setShowAppreciationBuilder] = useState(false);
  const [appreciationNoticed, setAppreciationNoticed] = useState("");
  const [appreciationQuality, setAppreciationQuality] = useState("");
  const [appreciationImpact, setAppreciationImpact] = useState("");
  const [appreciationInvitation, setAppreciationInvitation] = useState("");
  const [showApologyBuilder, setShowApologyBuilder] = useState(false);
  const [apologyAction, setApologyAction] = useState("");
  const [apologyImpact, setApologyImpact] = useState("");
  const [apologyOwnership, setApologyOwnership] = useState("");
  const [apologyRepair, setApologyRepair] = useState("");
  const [showConflictMapBuilder, setShowConflictMapBuilder] = useState(false);
  const [conflictObservation, setConflictObservation] = useState("");
  const [conflictFeeling, setConflictFeeling] = useState("");
  const [conflictStory, setConflictStory] = useState("");
  const [conflictRequest, setConflictRequest] = useState("");
  const [showSpaceBuilder, setShowSpaceBuilder] = useState(false);
  const [spaceCapacity, setSpaceCapacity] = useState("");
  const [spaceReassurance, setSpaceReassurance] = useState("");
  const [spaceReturnTime, setSpaceReturnTime] = useState("");
  const [spaceRequest, setSpaceRequest] = useState("");
  const [showBidRepairBuilder, setShowBidRepairBuilder] = useState(false);
  const [bidMissed, setBidMissed] = useState("");
  const [bidImpact, setBidImpact] = useState("");
  const [bidWish, setBidWish] = useState("");
  const [bidOffer, setBidOffer] = useState("");
  const [showListenBuilder, setShowListenBuilder] = useState(false);
  const [listenHeard, setListenHeard] = useState("");
  const [listenEmotion, setListenEmotion] = useState("");
  const [listenOwnership, setListenOwnership] = useState("");
  const [listenQuestion, setListenQuestion] = useState("");
  const [showLongingBuilder, setShowLongingBuilder] = useState(false);
  const [longingComplaint, setLongingComplaint] = useState("");
  const [longingNeed, setLongingNeed] = useState("");
  const [longingRequest, setLongingRequest] = useState("");
  const [longingAppreciation, setLongingAppreciation] = useState("");

  const focusTextarea = useCallback(() => {
    window.setTimeout(() => textareaRef.current?.focus(), 0);
  }, []);

  const applyStoredChatDraft = useCallback(() => {
    const stored = consumeStoredChatDraft();
    if (!stored) return;
    setInputText(stored.draft);
    focusTextarea();
  }, [focusTextarea, setInputText]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    const preparedDraft = prepareDraftForSend(inputText, locale);
    if (!preparedDraft.text || disabled) return;
    if (!preparedDraft.ready) {
      setInputText(preparedDraft.text);
      focusTextarea();
      return;
    }
    onSend(preparedDraft.text);
    setInputText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleReview = () => {
    const trimmed = inputText.trim();
    if (!trimmed) return;
    onReview(trimmed);
  };

  const handleBuildRepair = () => {
    setInputText(
      buildRepairDraft(
        {
          feeling: repairFeeling,
          ownership: repairOwnership,
          need: repairNeed,
          request: repairRequest,
        },
        locale,
      ),
    );
    setShowRepairBuilder(false);
    setComposerMode("improve");
    focusTextarea();
  };

  const handleBuildNeed = () => {
    setInputText(
      buildNeedDraft(
        {
          need: needValue,
          why: needWhy,
          request: needRequest,
          flexibility: needFlexibility,
        },
        locale,
      ),
    );
    setShowNeedBuilder(false);
    setComposerMode("improve");
    focusTextarea();
  };

  const handleBuildAppreciation = () => {
    setInputText(
      buildAppreciationDraft(
        {
          noticed: appreciationNoticed,
          quality: appreciationQuality,
          impact: appreciationImpact,
          invitation: appreciationInvitation,
        },
        locale,
      ),
    );
    setShowAppreciationBuilder(false);
    setComposerMode("improve");
    focusTextarea();
  };

  const handleBuildApology = () => {
    setInputText(
      buildApologyDraft(
        {
          action: apologyAction,
          impact: apologyImpact,
          ownership: apologyOwnership,
          repair: apologyRepair,
        },
        locale,
      ),
    );
    setShowApologyBuilder(false);
    setComposerMode("improve");
    focusTextarea();
  };

  const handleBuildConflictMap = () => {
    setInputText(
      buildConflictMapDraft(
        {
          observation: conflictObservation,
          feeling: conflictFeeling,
          story: conflictStory,
          request: conflictRequest,
        },
        locale,
      ),
    );
    setShowConflictMapBuilder(false);
    setComposerMode("improve");
    focusTextarea();
  };

  const handleBuildSpace = () => {
    setInputText(
      buildSpaceDraft(
        {
          capacity: spaceCapacity,
          reassurance: spaceReassurance,
          returnTime: spaceReturnTime,
          request: spaceRequest,
        },
        locale,
      ),
    );
    setShowSpaceBuilder(false);
    setComposerMode("improve");
    focusTextarea();
  };

  const handleBuildBidRepair = () => {
    setInputText(
      buildBidRepairDraft(
        {
          missed: bidMissed,
          impact: bidImpact,
          wish: bidWish,
          offer: bidOffer,
        },
        locale,
      ),
    );
    setShowBidRepairBuilder(false);
    setComposerMode("improve");
    focusTextarea();
  };

  const handleBuildListenFirst = () => {
    setInputText(
      buildListenFirstDraft(
        {
          heard: listenHeard,
          emotion: listenEmotion,
          ownership: listenOwnership,
          question: listenQuestion,
        },
        locale,
      ),
    );
    setShowListenBuilder(false);
    setComposerMode("improve");
    focusTextarea();
  };

  const handleBuildLonging = () => {
    setInputText(
      buildLongingDraft(
        {
          complaint: longingComplaint,
          longing: longingNeed,
          request: longingRequest,
          appreciation: longingAppreciation,
        },
        locale,
      ),
    );
    setShowLongingBuilder(false);
    setComposerMode("improve");
    focusTextarea();
  };

  const handlePauseBeforeSend = () => {
    setInputText(buildPauseBeforeSendDraft(inputText, locale));
    focusTextarea();
  };

  const handleRecommendedHeatedDraft = () => {
    if (heatedWarning?.recommendedAction === "pause") {
      handlePauseBeforeSend();
      return;
    }
    handleSoftenDraft();
  };

  const handleSoftenDraft = () => {
    setInputText(buildSofterStartDraft(inputText, locale));
    focusTextarea();
  };

  const handleFollowUpDraft = () => {
    setInputText(buildFollowUpDraft(inputText, locale));
    focusTextarea();
  };

  const handleAftercareDraft = () => {
    setInputText(buildAftercareDraft(inputText, locale));
    focusTextarea();
  };

  const handleMakeDraftReady = () => {
    setInputText(buildDraftReadyForSend(inputText, locale));
    focusTextarea();
  };

  const handleAskCoachAboutDraft = () => {
    const prompt = buildCoachReviewPrompt(inputText);
    window.localStorage.setItem("amore-coach-draft", prompt);
    window.dispatchEvent(new CustomEvent("amore:open-coach"));
  };

  const handleMakeDraftGoal = () => {
    storeGoalDraft(buildGoalDraftFromChatDraft(inputText, locale), locale);
    window.location.assign("/goals");
  };

  const heatedWarning = getHeatedDraftWarning(inputText);
  const draftCareChecks = inputText.trim() ? getDraftCareChecks(inputText) : [];
  const starters = getStarters(locale);
  const missingSpecificMoment = draftCareChecks.some(
    (check) => check.label === "Specific moment" && !check.passed,
  );
  const missingClearAsk = draftCareChecks.some(
    (check) => check.label === "Clear next ask" && !check.passed,
  );
  const missingOwnership = draftCareChecks.some(
    (check) => check.label === "No global blame" && !check.passed,
  );
  const missingWarmth = draftCareChecks.some(
    (check) => check.label === "Warmth signal" && !check.passed,
  );
  const missingRoomForNo = draftCareChecks.some(
    (check) => check.label === "Room for no" && !check.passed,
  );
  const allCareChecksPassed =
    draftCareChecks.length > 0 &&
    draftCareChecks.every((check) => check.passed);

  const closeGuides = () => {
    setShowRepairBuilder(false);
    setShowNeedBuilder(false);
    setShowAppreciationBuilder(false);
    setShowApologyBuilder(false);
    setShowConflictMapBuilder(false);
    setShowSpaceBuilder(false);
    setShowBidRepairBuilder(false);
    setShowListenBuilder(false);
    setShowLongingBuilder(false);
  };

  const openGuide = (guide: ChatGuide) => {
    setComposerMode("guide");
    closeGuides();
    if (guide === "aftercare") {
      setInputText(buildAftercareDraft("", locale));
      setComposerMode("improve");
      focusTextarea();
      return;
    }
    if (guide === "repair") setShowRepairBuilder(true);
    if (guide === "need") setShowNeedBuilder(true);
    if (guide === "appreciation") setShowAppreciationBuilder(true);
    if (guide === "apology") setShowApologyBuilder(true);
    if (guide === "conflict") setShowConflictMapBuilder(true);
    if (guide === "space") setShowSpaceBuilder(true);
    if (guide === "bid") setShowBidRepairBuilder(true);
    if (guide === "listen") setShowListenBuilder(true);
    if (guide === "longing") setShowLongingBuilder(true);
    focusTextarea();
  };

  useEffect(() => {
    const handleOpenGuide = (event: Event) => {
      const guide = (event as CustomEvent<ChatGuide>).detail;
      if (!guide) return;
      openGuide(guide);
    };

    window.addEventListener("amore:open-chat-guide", handleOpenGuide);
    return () =>
      window.removeEventListener("amore:open-chat-guide", handleOpenGuide);
  });

  // Auto-grow textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [inputText]);

  useEffect(() => {
    applyStoredChatDraft();

    const checkAfterClick = () => {
      window.setTimeout(applyStoredChatDraft, 0);
    };

    window.addEventListener("amore:chat-draft-ready", applyStoredChatDraft);
    window.addEventListener("click", checkAfterClick);

    return () => {
      window.removeEventListener(
        "amore:chat-draft-ready",
        applyStoredChatDraft,
      );
      window.removeEventListener("click", checkAfterClick);
    };
  }, [applyStoredChatDraft]);

  return (
    <div className="border-t border-warm-200 bg-warm-100 px-4 py-3">
      <div className="mb-3 inline-flex rounded-xl border border-warm-200 bg-white p-1 shadow-[0_1px_3px_rgba(42,33,24,0.04)]">
        {COMPOSER_MODES.map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => setComposerMode(mode)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
              composerMode === mode
                ? "bg-warm-900 text-white"
                : "text-warm-600 hover:bg-warm-50 hover:text-warm-900"
            }`}
            aria-pressed={composerMode === mode}
          >
            {t(
              mode === "write"
                ? "Write"
                : mode === "improve"
                  ? "Improve"
                  : "Guide",
            )}
          </button>
        ))}
      </div>
      {composerMode === "guide" && (
        <div className="mb-3 space-y-2">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {starters.map((starter) => (
              <button
                key={starter.label}
                type="button"
                onClick={() => {
                  setInputText(starter.text);
                  setComposerMode("improve");
                  focusTextarea();
                }}
                className="shrink-0 rounded-full border border-coral-200 bg-white px-3 py-1.5 text-xs font-medium text-coral-700 transition-colors hover:bg-coral-50"
              >
                {t(starter.label)}
              </button>
            ))}
            <button
              type="button"
              onClick={() => openGuide("repair")}
              className="shrink-0 rounded-full border border-warm-300 bg-warm-900 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-warm-800"
            >
              {t("Repair guide")}
            </button>
            <button
              type="button"
              onClick={() => openGuide("need")}
              className="shrink-0 rounded-full border border-sage-500/25 bg-sage-50 px-3 py-1.5 text-xs font-semibold text-sage-700 transition-colors hover:bg-sage-100"
            >
              {t("Need guide")}
            </button>
            <button
              type="button"
              onClick={() => openGuide("appreciation")}
              className="shrink-0 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 transition-colors hover:bg-amber-100"
            >
              {t("Appreciation guide")}
            </button>
            <button
              type="button"
              onClick={() => openGuide("apology")}
              className="shrink-0 rounded-full border border-coral-200 bg-white px-3 py-1.5 text-xs font-semibold text-coral-700 transition-colors hover:bg-coral-50"
            >
              {t("Apology guide")}
            </button>
            <button
              type="button"
              onClick={() => openGuide("conflict")}
              className="shrink-0 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 transition-colors hover:bg-indigo-100"
            >
              {t("Conflict map")}
            </button>
            <button
              type="button"
              onClick={() => openGuide("space")}
              className="shrink-0 rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 transition-colors hover:bg-sky-100"
            >
              {t("Space guide")}
            </button>
            <button
              type="button"
              onClick={() => openGuide("bid")}
              className="shrink-0 rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-100"
            >
              {t("Missed bid")}
            </button>
            <button
              type="button"
              onClick={() => openGuide("listen")}
              className="shrink-0 rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700 transition-colors hover:bg-teal-100"
            >
              {t("Listen first")}
            </button>
            <button
              type="button"
              onClick={() => openGuide("longing")}
              className="shrink-0 rounded-full border border-fuchsia-200 bg-fuchsia-50 px-3 py-1.5 text-xs font-semibold text-fuchsia-700 transition-colors hover:bg-fuchsia-100"
            >
              {t("Longing")}
            </button>
          </div>
          {showRepairBuilder && (
            <div className="rounded-2xl border border-warm-200 bg-white p-3 shadow-[0_1px_3px_rgba(42,33,24,0.04)]">
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  value={repairFeeling}
                  onChange={(event) => setRepairFeeling(event.target.value)}
                  placeholder="What I felt..."
                  className="rounded-xl border border-warm-200 px-3 py-2 text-xs text-warm-900 placeholder:text-warm-400 focus:border-coral-400 focus:outline-none"
                />
                <input
                  value={repairOwnership}
                  onChange={(event) => setRepairOwnership(event.target.value)}
                  placeholder="What I can own..."
                  className="rounded-xl border border-warm-200 px-3 py-2 text-xs text-warm-900 placeholder:text-warm-400 focus:border-coral-400 focus:outline-none"
                />
                <input
                  value={repairNeed}
                  onChange={(event) => setRepairNeed(event.target.value)}
                  placeholder="What I need..."
                  className="rounded-xl border border-warm-200 px-3 py-2 text-xs text-warm-900 placeholder:text-warm-400 focus:border-coral-400 focus:outline-none"
                />
                <input
                  value={repairRequest}
                  onChange={(event) => setRepairRequest(event.target.value)}
                  placeholder="Could we..."
                  className="rounded-xl border border-warm-200 px-3 py-2 text-xs text-warm-900 placeholder:text-warm-400 focus:border-coral-400 focus:outline-none"
                />
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleBuildRepair}
                  className="rounded-lg bg-coral-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-coral-600"
                >
                  {t("Build repair")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRepairFeeling("");
                    setRepairOwnership("");
                    setRepairNeed("");
                    setRepairRequest("");
                  }}
                  className="rounded-lg border border-warm-200 bg-white px-3 py-1.5 text-xs font-semibold text-warm-600 transition-colors hover:bg-warm-50"
                >
                  {t("Clear")}
                </button>
              </div>
            </div>
          )}
          {showNeedBuilder && (
            <div className="rounded-2xl border border-sage-500/20 bg-white p-3 shadow-[0_1px_3px_rgba(42,33,24,0.04)]">
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  value={needValue}
                  onChange={(event) => setNeedValue(event.target.value)}
                  placeholder="What I need..."
                  className="rounded-xl border border-warm-200 px-3 py-2 text-xs text-warm-900 placeholder:text-warm-400 focus:border-sage-500 focus:outline-none"
                />
                <input
                  value={needWhy}
                  onChange={(event) => setNeedWhy(event.target.value)}
                  placeholder="Why it matters..."
                  className="rounded-xl border border-warm-200 px-3 py-2 text-xs text-warm-900 placeholder:text-warm-400 focus:border-sage-500 focus:outline-none"
                />
                <input
                  value={needRequest}
                  onChange={(event) => setNeedRequest(event.target.value)}
                  placeholder="Could we..."
                  className="rounded-xl border border-warm-200 px-3 py-2 text-xs text-warm-900 placeholder:text-warm-400 focus:border-sage-500 focus:outline-none"
                />
                <input
                  value={needFlexibility}
                  onChange={(event) => setNeedFlexibility(event.target.value)}
                  placeholder="I am flexible about..."
                  className="rounded-xl border border-warm-200 px-3 py-2 text-xs text-warm-900 placeholder:text-warm-400 focus:border-sage-500 focus:outline-none"
                />
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleBuildNeed}
                  className="rounded-lg bg-sage-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-700"
                >
                  {t("Build need")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNeedValue("");
                    setNeedWhy("");
                    setNeedRequest("");
                    setNeedFlexibility("");
                  }}
                  className="rounded-lg border border-warm-200 bg-white px-3 py-1.5 text-xs font-semibold text-warm-600 transition-colors hover:bg-warm-50"
                >
                  {t("Clear")}
                </button>
              </div>
            </div>
          )}
          {showAppreciationBuilder && (
            <div className="rounded-2xl border border-amber-200 bg-white p-3 shadow-[0_1px_3px_rgba(42,33,24,0.04)]">
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  value={appreciationNoticed}
                  onChange={(event) =>
                    setAppreciationNoticed(event.target.value)
                  }
                  placeholder="What I noticed..."
                  className="rounded-xl border border-warm-200 px-3 py-2 text-xs text-warm-900 placeholder:text-warm-400 focus:border-amber-400 focus:outline-none"
                />
                <input
                  value={appreciationQuality}
                  onChange={(event) =>
                    setAppreciationQuality(event.target.value)
                  }
                  placeholder="What it showed me..."
                  className="rounded-xl border border-warm-200 px-3 py-2 text-xs text-warm-900 placeholder:text-warm-400 focus:border-amber-400 focus:outline-none"
                />
                <input
                  value={appreciationImpact}
                  onChange={(event) =>
                    setAppreciationImpact(event.target.value)
                  }
                  placeholder="How it landed..."
                  className="rounded-xl border border-warm-200 px-3 py-2 text-xs text-warm-900 placeholder:text-warm-400 focus:border-amber-400 focus:outline-none"
                />
                <input
                  value={appreciationInvitation}
                  onChange={(event) =>
                    setAppreciationInvitation(event.target.value)
                  }
                  placeholder="Could we..."
                  className="rounded-xl border border-warm-200 px-3 py-2 text-xs text-warm-900 placeholder:text-warm-400 focus:border-amber-400 focus:outline-none"
                />
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleBuildAppreciation}
                  className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-amber-600"
                >
                  {t("Build appreciation")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAppreciationNoticed("");
                    setAppreciationQuality("");
                    setAppreciationImpact("");
                    setAppreciationInvitation("");
                  }}
                  className="rounded-lg border border-warm-200 bg-white px-3 py-1.5 text-xs font-semibold text-warm-600 transition-colors hover:bg-warm-50"
                >
                  {t("Clear")}
                </button>
              </div>
            </div>
          )}
          {showApologyBuilder && (
            <div className="rounded-2xl border border-coral-200 bg-white p-3 shadow-[0_1px_3px_rgba(42,33,24,0.04)]">
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  value={apologyAction}
                  onChange={(event) => setApologyAction(event.target.value)}
                  placeholder="What I did..."
                  className="rounded-xl border border-warm-200 px-3 py-2 text-xs text-warm-900 placeholder:text-warm-400 focus:border-coral-400 focus:outline-none"
                />
                <input
                  value={apologyImpact}
                  onChange={(event) => setApologyImpact(event.target.value)}
                  placeholder="Impact I can see..."
                  className="rounded-xl border border-warm-200 px-3 py-2 text-xs text-warm-900 placeholder:text-warm-400 focus:border-coral-400 focus:outline-none"
                />
                <input
                  value={apologyOwnership}
                  onChange={(event) => setApologyOwnership(event.target.value)}
                  placeholder="What I own..."
                  className="rounded-xl border border-warm-200 px-3 py-2 text-xs text-warm-900 placeholder:text-warm-400 focus:border-coral-400 focus:outline-none"
                />
                <input
                  value={apologyRepair}
                  onChange={(event) => setApologyRepair(event.target.value)}
                  placeholder="Repair ask..."
                  className="rounded-xl border border-warm-200 px-3 py-2 text-xs text-warm-900 placeholder:text-warm-400 focus:border-coral-400 focus:outline-none"
                />
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleBuildApology}
                  className="rounded-lg bg-coral-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-coral-600"
                >
                  {t("Build apology")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setApologyAction("");
                    setApologyImpact("");
                    setApologyOwnership("");
                    setApologyRepair("");
                  }}
                  className="rounded-lg border border-warm-200 bg-white px-3 py-1.5 text-xs font-semibold text-warm-600 transition-colors hover:bg-warm-50"
                >
                  {t("Clear")}
                </button>
              </div>
            </div>
          )}
          {showConflictMapBuilder && (
            <div className="rounded-2xl border border-indigo-200 bg-white p-3 shadow-[0_1px_3px_rgba(42,33,24,0.04)]">
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  value={conflictObservation}
                  onChange={(event) =>
                    setConflictObservation(event.target.value)
                  }
                  placeholder="What happened..."
                  className="rounded-xl border border-warm-200 px-3 py-2 text-xs text-warm-900 placeholder:text-warm-400 focus:border-indigo-400 focus:outline-none"
                />
                <input
                  value={conflictFeeling}
                  onChange={(event) => setConflictFeeling(event.target.value)}
                  placeholder="What I felt..."
                  className="rounded-xl border border-warm-200 px-3 py-2 text-xs text-warm-900 placeholder:text-warm-400 focus:border-indigo-400 focus:outline-none"
                />
                <input
                  value={conflictStory}
                  onChange={(event) => setConflictStory(event.target.value)}
                  placeholder="Story I told myself..."
                  className="rounded-xl border border-warm-200 px-3 py-2 text-xs text-warm-900 placeholder:text-warm-400 focus:border-indigo-400 focus:outline-none"
                />
                <input
                  value={conflictRequest}
                  onChange={(event) => setConflictRequest(event.target.value)}
                  placeholder="Could we..."
                  className="rounded-xl border border-warm-200 px-3 py-2 text-xs text-warm-900 placeholder:text-warm-400 focus:border-indigo-400 focus:outline-none"
                />
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleBuildConflictMap}
                  className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-indigo-700"
                >
                  {t("Build conflict map")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConflictObservation("");
                    setConflictFeeling("");
                    setConflictStory("");
                    setConflictRequest("");
                  }}
                  className="rounded-lg border border-warm-200 bg-white px-3 py-1.5 text-xs font-semibold text-warm-600 transition-colors hover:bg-warm-50"
                >
                  {t("Clear")}
                </button>
              </div>
            </div>
          )}
          {showSpaceBuilder && (
            <div className="rounded-2xl border border-sky-200 bg-white p-3 shadow-[0_1px_3px_rgba(42,33,24,0.04)]">
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  value={spaceReassurance}
                  onChange={(event) => setSpaceReassurance(event.target.value)}
                  placeholder="Reassurance..."
                  className="rounded-xl border border-warm-200 px-3 py-2 text-xs text-warm-900 placeholder:text-warm-400 focus:border-sky-400 focus:outline-none"
                />
                <input
                  value={spaceCapacity}
                  onChange={(event) => setSpaceCapacity(event.target.value)}
                  placeholder="Why I need space..."
                  className="rounded-xl border border-warm-200 px-3 py-2 text-xs text-warm-900 placeholder:text-warm-400 focus:border-sky-400 focus:outline-none"
                />
                <input
                  value={spaceReturnTime}
                  onChange={(event) => setSpaceReturnTime(event.target.value)}
                  placeholder="When I will return..."
                  className="rounded-xl border border-warm-200 px-3 py-2 text-xs text-warm-900 placeholder:text-warm-400 focus:border-sky-400 focus:outline-none"
                />
                <input
                  value={spaceRequest}
                  onChange={(event) => setSpaceRequest(event.target.value)}
                  placeholder="Could we..."
                  className="rounded-xl border border-warm-200 px-3 py-2 text-xs text-warm-900 placeholder:text-warm-400 focus:border-sky-400 focus:outline-none"
                />
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleBuildSpace}
                  className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-sky-700"
                >
                  {t("Build space request")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSpaceCapacity("");
                    setSpaceReassurance("");
                    setSpaceReturnTime("");
                    setSpaceRequest("");
                  }}
                  className="rounded-lg border border-warm-200 bg-white px-3 py-1.5 text-xs font-semibold text-warm-600 transition-colors hover:bg-warm-50"
                >
                  {t("Clear")}
                </button>
              </div>
            </div>
          )}
          {showBidRepairBuilder && (
            <div className="rounded-2xl border border-rose-200 bg-white p-3 shadow-[0_1px_3px_rgba(42,33,24,0.04)]">
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  value={bidMissed}
                  onChange={(event) => setBidMissed(event.target.value)}
                  placeholder="What I missed..."
                  className="rounded-xl border border-warm-200 px-3 py-2 text-xs text-warm-900 placeholder:text-warm-400 focus:border-rose-400 focus:outline-none"
                />
                <input
                  value={bidImpact}
                  onChange={(event) => setBidImpact(event.target.value)}
                  placeholder="How it may have landed..."
                  className="rounded-xl border border-warm-200 px-3 py-2 text-xs text-warm-900 placeholder:text-warm-400 focus:border-rose-400 focus:outline-none"
                />
                <input
                  value={bidWish}
                  onChange={(event) => setBidWish(event.target.value)}
                  placeholder="What I wish I had done..."
                  className="rounded-xl border border-warm-200 px-3 py-2 text-xs text-warm-900 placeholder:text-warm-400 focus:border-rose-400 focus:outline-none"
                />
                <input
                  value={bidOffer}
                  onChange={(event) => setBidOffer(event.target.value)}
                  placeholder="Can I..."
                  className="rounded-xl border border-warm-200 px-3 py-2 text-xs text-warm-900 placeholder:text-warm-400 focus:border-rose-400 focus:outline-none"
                />
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleBuildBidRepair}
                  className="rounded-lg bg-rose-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-rose-600"
                >
                  {t("Build missed-bid repair")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBidMissed("");
                    setBidImpact("");
                    setBidWish("");
                    setBidOffer("");
                  }}
                  className="rounded-lg border border-warm-200 bg-white px-3 py-1.5 text-xs font-semibold text-warm-600 transition-colors hover:bg-warm-50"
                >
                  {t("Clear")}
                </button>
              </div>
            </div>
          )}
          {showListenBuilder && (
            <div className="rounded-2xl border border-teal-200 bg-white p-3 shadow-[0_1px_3px_rgba(42,33,24,0.04)]">
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  value={listenHeard}
                  onChange={(event) => setListenHeard(event.target.value)}
                  placeholder="What I heard..."
                  className="rounded-xl border border-warm-200 px-3 py-2 text-xs text-warm-900 placeholder:text-warm-400 focus:border-teal-400 focus:outline-none"
                />
                <input
                  value={listenEmotion}
                  onChange={(event) => setListenEmotion(event.target.value)}
                  placeholder="What they felt..."
                  className="rounded-xl border border-warm-200 px-3 py-2 text-xs text-warm-900 placeholder:text-warm-400 focus:border-teal-400 focus:outline-none"
                />
                <input
                  value={listenOwnership}
                  onChange={(event) => setListenOwnership(event.target.value)}
                  placeholder="One part I can own..."
                  className="rounded-xl border border-warm-200 px-3 py-2 text-xs text-warm-900 placeholder:text-warm-400 focus:border-teal-400 focus:outline-none"
                />
                <input
                  value={listenQuestion}
                  onChange={(event) => setListenQuestion(event.target.value)}
                  placeholder="One clarifying question..."
                  className="rounded-xl border border-warm-200 px-3 py-2 text-xs text-warm-900 placeholder:text-warm-400 focus:border-teal-400 focus:outline-none"
                />
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleBuildListenFirst}
                  className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-teal-700"
                >
                  {t("Build listening reply")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setListenHeard("");
                    setListenEmotion("");
                    setListenOwnership("");
                    setListenQuestion("");
                  }}
                  className="rounded-lg border border-warm-200 bg-white px-3 py-1.5 text-xs font-semibold text-warm-600 transition-colors hover:bg-warm-50"
                >
                  {t("Clear")}
                </button>
              </div>
            </div>
          )}
          {showLongingBuilder && (
            <div className="rounded-2xl border border-fuchsia-200 bg-white p-3 shadow-[0_1px_3px_rgba(42,33,24,0.04)]">
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  value={longingComplaint}
                  onChange={(event) => setLongingComplaint(event.target.value)}
                  placeholder="The complaint..."
                  className="rounded-xl border border-warm-200 px-3 py-2 text-xs text-warm-900 placeholder:text-warm-400 focus:border-fuchsia-400 focus:outline-none"
                />
                <input
                  value={longingNeed}
                  onChange={(event) => setLongingNeed(event.target.value)}
                  placeholder="The longing underneath..."
                  className="rounded-xl border border-warm-200 px-3 py-2 text-xs text-warm-900 placeholder:text-warm-400 focus:border-fuchsia-400 focus:outline-none"
                />
                <input
                  value={longingRequest}
                  onChange={(event) => setLongingRequest(event.target.value)}
                  placeholder="Could we try..."
                  className="rounded-xl border border-warm-200 px-3 py-2 text-xs text-warm-900 placeholder:text-warm-400 focus:border-fuchsia-400 focus:outline-none"
                />
                <input
                  value={longingAppreciation}
                  onChange={(event) =>
                    setLongingAppreciation(event.target.value)
                  }
                  placeholder="One thing I appreciate..."
                  className="rounded-xl border border-warm-200 px-3 py-2 text-xs text-warm-900 placeholder:text-warm-400 focus:border-fuchsia-400 focus:outline-none"
                />
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleBuildLonging}
                  className="rounded-lg bg-fuchsia-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-fuchsia-700"
                >
                  {t("Build longing request")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLongingComplaint("");
                    setLongingNeed("");
                    setLongingRequest("");
                    setLongingAppreciation("");
                  }}
                  className="rounded-lg border border-warm-200 bg-white px-3 py-1.5 text-xs font-semibold text-warm-600 transition-colors hover:bg-warm-50"
                >
                  {t("Clear")}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      {composerMode === "improve" && heatedWarning && (
        <div className="mb-3 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2.5">
          <p className="text-xs font-semibold text-amber-900">
            {heatedWarning.title}
          </p>
          <p className="mt-1 text-xs leading-5 text-amber-800">
            {heatedWarning.body}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleRecommendedHeatedDraft}
              className="rounded-lg bg-warm-900 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-warm-800"
            >
              {t(heatedWarning.recommendedLabel)}
            </button>
            <button
              type="button"
              onClick={handleSoftenDraft}
              className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-amber-600"
            >
              {t("Soften this")}
            </button>
            <button
              type="button"
              onClick={handlePauseBeforeSend}
              className="rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-xs font-semibold text-amber-700 transition-colors hover:bg-amber-100"
            >
              {t("Pause instead")}
            </button>
          </div>
        </div>
      )}
      {composerMode === "improve" && draftCareChecks.length > 0 && (
        <div className="mb-3 rounded-2xl border border-warm-200 bg-white px-3 py-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold text-warm-800">
              {t("Local draft check")}
            </p>
            {allCareChecksPassed && (
              <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                {t("Ready to send")}
              </span>
            )}
            {!allCareChecksPassed && (
              <button
                type="button"
                onClick={handleMakeDraftReady}
                className="rounded-lg bg-warm-900 px-2.5 py-1 text-xs font-semibold text-white transition-colors hover:bg-warm-800"
              >
                {t("Make ready")}
              </button>
            )}
            {missingSpecificMoment && (
              <button
                type="button"
                onClick={() => {
                  setInputText(buildDraftWithSpecificMoment(inputText, locale));
                  focusTextarea();
                }}
                className="rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 transition-colors hover:bg-indigo-100"
              >
                {t("Add moment")}
              </button>
            )}
            {missingClearAsk && (
              <button
                type="button"
                onClick={() => {
                  setInputText(buildDraftWithClearAsk(inputText, locale));
                  focusTextarea();
                }}
                className="rounded-lg border border-coral-200 bg-coral-50 px-2.5 py-1 text-xs font-semibold text-coral-700 transition-colors hover:bg-coral-100"
              >
                {t("Add clear ask")}
              </button>
            )}
            {missingOwnership && (
              <button
                type="button"
                onClick={() => {
                  setInputText(buildDraftWithOwnership(inputText, locale));
                  focusTextarea();
                }}
                className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 transition-colors hover:bg-amber-100"
              >
                {t("Add ownership")}
              </button>
            )}
            {missingWarmth && (
              <button
                type="button"
                onClick={() => {
                  setInputText(buildDraftWithWarmth(inputText, locale));
                  focusTextarea();
                }}
                className="rounded-lg border border-sage-500/20 bg-sage-50 px-2.5 py-1 text-xs font-semibold text-sage-700 transition-colors hover:bg-sage-100"
              >
                {t("Add warmth")}
              </button>
            )}
            {missingRoomForNo && (
              <button
                type="button"
                onClick={() => {
                  setInputText(buildDraftWithRoomForNo(inputText, locale));
                  focusTextarea();
                }}
                className="rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700 transition-colors hover:bg-sky-100"
              >
                {t("Add choice")}
              </button>
            )}
          </div>
          <ul className="mt-2 flex flex-wrap gap-2">
            {draftCareChecks.map((check) => (
              <li
                key={check.label}
                className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                  check.passed
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-amber-200 bg-amber-50 text-amber-800"
                }`}
                title={check.detail}
              >
                {t(check.passed ? "OK" : "Needs")}: {t(check.label)}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="flex flex-wrap items-end gap-2">
        <textarea
          ref={textareaRef}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t("Type a message...")}
          rows={2}
          className="min-h-[72px] min-w-0 flex-[1_1_280px] resize-none rounded-xl border border-warm-300 px-3 py-2.5 text-sm leading-5 text-warm-900 placeholder:text-warm-400 focus:border-coral-400 focus:outline-none focus:ring-1 focus:ring-coral-400/20 transition-colors"
          style={{ minHeight: "72px", maxHeight: "160px" }}
        />
        {composerMode === "improve" && (
          <>
            <button
              onClick={handleSoftenDraft}
              disabled={!inputText.trim()}
              className="whitespace-nowrap rounded-lg px-2.5 py-2 text-xs font-medium text-warm-500 transition-colors hover:bg-coral-50 hover:text-coral-700 disabled:cursor-not-allowed disabled:opacity-40"
              title={t("Rewrite this into a softer start")}
            >
              {t("Soften")}
            </button>
            <button
              onClick={handlePauseBeforeSend}
              disabled={!inputText.trim()}
              className="whitespace-nowrap rounded-lg px-2.5 py-2 text-xs font-medium text-warm-500 transition-colors hover:bg-sage-50 hover:text-sage-700 disabled:cursor-not-allowed disabled:opacity-40"
              title={t("Turn this into a 20-minute pause request")}
            >
              {t("Pause")}
            </button>
            <button
              onClick={handleFollowUpDraft}
              disabled={!inputText.trim()}
              className="whitespace-nowrap rounded-lg px-2.5 py-2 text-xs font-medium text-warm-500 transition-colors hover:bg-indigo-50 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
              title={t("Prepare a follow-up that checks how this landed")}
            >
              {t("Follow up")}
            </button>
            <button
              onClick={handleAftercareDraft}
              disabled={!inputText.trim()}
              className="whitespace-nowrap rounded-lg px-2.5 py-2 text-xs font-medium text-warm-500 transition-colors hover:bg-emerald-50 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
              title={t("Turn this into a small aftercare plan")}
            >
              {t("Aftercare")}
            </button>
            <button
              onClick={handleAskCoachAboutDraft}
              disabled={!inputText.trim()}
              className="whitespace-nowrap rounded-lg px-2.5 py-2 text-xs font-medium text-warm-500 transition-colors hover:bg-sky-50 hover:text-sky-700 disabled:cursor-not-allowed disabled:opacity-40"
              title={t("Ask coach to improve this draft")}
            >
              {t("Coach")}
            </button>
            <button
              onClick={handleMakeDraftGoal}
              disabled={!inputText.trim()}
              className="whitespace-nowrap rounded-lg px-2.5 py-2 text-xs font-medium text-warm-500 transition-colors hover:bg-rose-50 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-40"
              title={t("Turn this draft into a tiny goal")}
            >
              {t("Goal")}
            </button>
            <button
              onClick={handleReview}
              disabled={!inputText.trim() || reviewLoading}
              className="whitespace-nowrap rounded-lg px-2.5 py-2 text-xs font-medium text-warm-500 transition-colors hover:bg-coral-50 hover:text-coral-600 disabled:cursor-not-allowed disabled:opacity-40"
              title={t("Review tone with AI")}
            >
              {reviewLoading ? (
                <svg
                  className="h-4 w-4 animate-spin"
                  viewBox="0 0 16 16"
                  fill="none"
                >
                  <circle
                    cx="8"
                    cy="8"
                    r="6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeDasharray="28"
                    strokeDashoffset="8"
                    strokeLinecap="round"
                  />
                </svg>
              ) : (
                `\u2728 ${t("Review")}`
              )}
            </button>
          </>
        )}
        <button
          onClick={handleSend}
          disabled={disabled || !inputText.trim()}
          className="rounded-lg bg-warm-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-warm-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {t(allCareChecksPassed ? "Send" : "Fix before send")}
        </button>
      </div>
    </div>
  );
}
