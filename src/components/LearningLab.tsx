import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { type GuideExpression, MimoGuide } from "../../packages/mimo-guide/src";
import {
  type GuideCharacterId,
  getGuideCharacter,
  guideCharacters,
} from "../../packages/mimo-guide/src/characters";

type LessonQuestion = {
  eyebrow: string;
  title: string;
  prompt: string;
  options: readonly string[];
  answer: number;
  insight: string;
};

type Lesson = {
  title: string;
  shortTitle: string;
  description: string;
  duration: string;
  questions: readonly LessonQuestion[];
};

type LabPhase = "question" | "thinking" | "feedback" | "complete";

const lessons: Record<GuideCharacterId, Lesson> = {
  sage: {
    title: "The art of better questions",
    shortTitle: "Curious thinking",
    description: "Turn a vague problem into something you can actually solve.",
    duration: "3 min",
    questions: [
      {
        eyebrow: "Start with clarity",
        title: "Make the problem visible",
        prompt: "Which question is most useful when a project feels overwhelming?",
        options: [
          "Why is everything going wrong?",
          "What is the smallest outcome that would count as progress?",
          "Should I wait until I feel more motivated?",
        ],
        answer: 1,
        insight: "A small, observable outcome gives your next action a clear edge.",
      },
      {
        eyebrow: "Find the constraint",
        title: "Separate fact from assumption",
        prompt: "A deadline looks impossible. What should you identify first?",
        options: [
          "The loudest opinion in the room",
          "Every possible future risk",
          "The constraint that actually controls the schedule",
        ],
        answer: 2,
        insight:
          "The real constraint is often narrower—and more changeable—than the whole problem.",
      },
      {
        eyebrow: "Choose a next move",
        title: "Prefer a testable step",
        prompt: "Which plan creates the fastest useful learning?",
        options: [
          "Build a small version and observe what happens",
          "Perfect the complete plan before starting",
          "Collect more ideas without testing any",
        ],
        answer: 0,
        insight: "A small test replaces uncertainty with evidence you can use.",
      },
    ],
  },
  socrates: {
    title: "Socrates on strong arguments",
    shortTitle: "Clear reasoning",
    description: "Examine claims, assumptions, and evidence in three short steps.",
    duration: "4 min",
    questions: [
      {
        eyebrow: "Question the claim",
        title: "Begin with meaning",
        prompt: "Someone says a solution is ‘obviously better.’ What should you ask first?",
        options: ["Who agrees with you?", "What do you mean by better?", "Can we decide quickly?"],
        answer: 1,
        insight: "Defining the key term prevents two people from arguing about different things.",
      },
      {
        eyebrow: "Reveal assumptions",
        title: "Test what is hidden",
        prompt: "Which question best exposes an assumption?",
        options: [
          "What must be true for this conclusion to hold?",
          "How confidently can we present it?",
          "Can we make the slide shorter?",
        ],
        answer: 0,
        insight: "Every conclusion rests on conditions. Naming them makes the reasoning testable.",
      },
      {
        eyebrow: "Weigh the evidence",
        title: "Look for disconfirmation",
        prompt: "What is the strongest way to challenge your own position?",
        options: [
          "Repeat the supporting evidence",
          "Ask what evidence would prove you wrong",
          "Avoid the least certain part",
        ],
        answer: 1,
        insight: "A claim that survives a serious attempt to disprove it becomes more trustworthy.",
      },
    ],
  },
  tesla: {
    title: "Tesla’s electricity lab",
    shortTitle: "Electric basics",
    description: "See how voltage, current, and resistance work together.",
    duration: "4 min",
    questions: [
      {
        eyebrow: "Create the push",
        title: "Voltage starts the story",
        prompt: "In a simple circuit, what is voltage most like?",
        options: ["A push that moves charge", "The width of the wire", "A count of electrons"],
        answer: 0,
        insight: "Voltage is electrical potential—the push that can move charge through a circuit.",
      },
      {
        eyebrow: "Watch the flow",
        title: "Current is movement",
        prompt: "What does electrical current measure?",
        options: [
          "How warm a component feels",
          "How much charge flows over time",
          "How long a battery will last",
        ],
        answer: 1,
        insight: "Current measures the rate of charge flowing through a point in the circuit.",
      },
      {
        eyebrow: "Control the path",
        title: "Resistance pushes back",
        prompt: "If voltage stays constant and resistance increases, what happens to current?",
        options: ["It increases", "It stays identical", "It decreases"],
        answer: 2,
        insight: "Ohm’s law tells us that more resistance means less current at the same voltage.",
      },
    ],
  },
  leonardo: {
    title: "Leonardo’s observation studio",
    shortTitle: "Creative observation",
    description: "Train your eye to notice structure, movement, and useful detail.",
    duration: "3 min",
    questions: [
      {
        eyebrow: "Look before naming",
        title: "Observe what is there",
        prompt: "Which note is the most useful direct observation?",
        options: [
          "The mechanism is badly designed",
          "The left hinge moves two seconds after the right",
          "The inventor did not understand motion",
        ],
        answer: 1,
        insight:
          "Specific, visible behavior gives you material to investigate without premature judgment.",
      },
      {
        eyebrow: "Find relationships",
        title: "Study cause and effect",
        prompt: "What should a sketch capture when studying motion?",
        options: [
          "Only the finished appearance",
          "Arrows, sequence, and points of contact",
          "As much decoration as possible",
        ],
        answer: 1,
        insight: "Relationships and direction turn a sketch into a tool for thinking.",
      },
      {
        eyebrow: "Cross boundaries",
        title: "Borrow from nature",
        prompt: "Why study a bird wing when designing a flying machine?",
        options: [
          "To copy its appearance exactly",
          "To avoid testing mechanical ideas",
          "To discover principles that can inspire a new mechanism",
        ],
        answer: 2,
        insight: "Analogy is powerful when you transfer a principle, not merely a surface shape.",
      },
    ],
  },
};

export default function LearningLab() {
  const [characterId, setCharacterId] = useState<GuideCharacterId>("tesla");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [phase, setPhase] = useState<LabPhase>("question");
  const [score, setScore] = useState(0);
  const [coach, setCoach] = useState<{ expression: GuideExpression; message: string }>({
    expression: "curious",
    message: "Choose an answer when you’re ready. I’ll think it through with you.",
  });
  const evaluationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const explanationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const character = getGuideCharacter(characterId);
  const lesson = lessons[characterId];
  const question = lesson.questions[questionIndex];
  const isCorrect = selectedAnswer === question?.answer;
  const completedQuestions = phase === "complete" ? lesson.questions.length : questionIndex;
  const progress = Math.round((completedQuestions / lesson.questions.length) * 100);

  const clearEvaluationTimer = useCallback(() => {
    if (evaluationTimer.current) clearTimeout(evaluationTimer.current);
    if (explanationTimer.current) clearTimeout(explanationTimer.current);
    evaluationTimer.current = null;
    explanationTimer.current = null;
  }, []);

  const resetLesson = useCallback(
    (nextCharacter: GuideCharacterId = characterId) => {
      clearEvaluationTimer();
      setCharacterId(nextCharacter);
      setQuestionIndex(0);
      setSelectedAnswer(null);
      setPhase("question");
      setScore(0);
      setCoach({
        expression: "curious",
        message: `${getGuideCharacter(nextCharacter).label} is ready. Choose an answer to begin.`,
      });
    },
    [characterId, clearEvaluationTimer],
  );

  useEffect(() => () => clearEvaluationTimer(), [clearEvaluationTimer]);

  useEffect(() => {
    if (phase !== "question" || selectedAnswer !== null) return;
    const timer = setTimeout(() => {
      setCoach({
        expression: "sleepy",
        message: "Still with me? Take your time—I’ll keep our place.",
      });
    }, 12000);
    return () => clearTimeout(timer);
  }, [phase, selectedAnswer]);

  const chooseAnswer = (answerIndex: number) => {
    if (phase !== "question") return;
    setSelectedAnswer(answerIndex);
    setCoach({ expression: "listening", message: "Good—your answer is in. Ready to check it?" });
  };

  const checkAnswer = () => {
    if (selectedAnswer === null || phase !== "question") return;
    setPhase("thinking");
    setCoach({ expression: "thinking", message: "Let me connect that answer to the idea…" });
    evaluationTimer.current = setTimeout(() => {
      const correct = selectedAnswer === question.answer;
      if (correct) setScore((value) => value + 1);
      setPhase("feedback");
      setCoach({
        expression: correct
          ? score >= 1
            ? "impressed"
            : "happy"
          : questionIndex > 0 && score === 0
            ? "reassuring"
            : "encouraging",
        message: correct
          ? score >= 1
            ? "Excellent—you’re connecting the ideas quickly."
            : "Exactly right. You found the key idea."
          : questionIndex > 0 && score === 0
            ? "You’re still learning. Let’s make this one feel clearer."
            : "Good try—you’re on the right track.",
      });
      explanationTimer.current = setTimeout(() => {
        setCoach({
          expression: "explaining",
          message: question.insight,
        });
        explanationTimer.current = null;
      }, 1200);
      evaluationTimer.current = null;
    }, 850);
  };

  const continueLesson = () => {
    if (phase !== "feedback") return;
    clearEvaluationTimer();
    if (questionIndex === lesson.questions.length - 1) {
      setPhase("complete");
      setCoach({
        expression: "celebrating",
        message:
          score === lesson.questions.length
            ? "Perfect lesson! Every idea connected."
            : "Lesson complete. You turned three questions into something you can use.",
      });
      return;
    }
    const nextQuestionIndex = questionIndex + 1;
    setQuestionIndex(nextQuestionIndex);
    setSelectedAnswer(null);
    setPhase("question");
    setCoach({
      expression: nextQuestionIndex === lesson.questions.length - 1 ? "focused" : "curious",
      message:
        nextQuestionIndex === lesson.questions.length - 1
          ? "Final challenge. Focus on how the ideas fit together."
          : "Nice work. Let’s build on that with the next question.",
    });
  };

  const statusSteps = useMemo(
    () => [
      { label: "Listen", active: selectedAnswer !== null || phase !== "question" },
      {
        label: "Think",
        active: phase === "thinking" || phase === "feedback" || phase === "complete",
      },
      { label: "React", active: phase === "feedback" || phase === "complete" },
      {
        label: "Explain",
        active: coach.expression === "explaining" || phase === "complete",
      },
    ],
    [coach.expression, phase, selectedAnswer],
  );

  return (
    <div
      className="learning-lab"
      style={
        {
          "--guide-accent": character.accent,
          "--guide-stage": character.stage,
        } as React.CSSProperties
      }
    >
      <header className="lab-header">
        <Link className="lab-brand" to="/" aria-label="Mimo Guide Studio home">
          <span className="lab-brand-mark">M</span>
          <span>
            <strong>Mimo</strong>
            <small>Learning Lab</small>
          </span>
        </Link>
        <div className="lab-header-meta">
          <span className="lab-live-label">
            <i /> Live integration
          </span>
          <Link className="lab-back-link" to="/">
            <ArrowLeft aria-hidden="true" /> Back to Studio
          </Link>
        </div>
      </header>

      <main className="lab-shell">
        <aside className="lab-roster" aria-label="Choose your guide">
          <div className="lab-section-label">
            <span>01</span>
            <p>Choose your guide</p>
          </div>
          <div className="lab-character-list">
            {guideCharacters.map((item) => (
              <button
                type="button"
                key={item.id}
                className={item.id === characterId ? "active" : ""}
                style={{ "--item-accent": item.accent } as React.CSSProperties}
                onClick={() => resetLesson(item.id)}
                aria-pressed={item.id === characterId}
              >
                <span className="lab-character-orb">{item.label.slice(0, 1)}</span>
                <span>
                  <strong>{item.label}</strong>
                  <small>{lessons[item.id].shortTitle}</small>
                </span>
                {item.id === characterId ? <Check aria-hidden="true" /> : null}
              </button>
            ))}
          </div>
          <div className="lab-roster-note">
            <Sparkles aria-hidden="true" />
            <p>
              <strong>One component, real product states.</strong>Each interaction drives a
              controlled Mimo expression.
            </p>
          </div>
        </aside>

        <section className="lab-lesson" aria-labelledby="lesson-title">
          <div className="lab-lesson-top">
            <div>
              <span className="lab-kicker">Interactive lesson · {lesson.duration}</span>
              <h1 id="lesson-title">{lesson.title}</h1>
              <p>{lesson.description}</p>
            </div>
            <button className="lab-reset-button" type="button" onClick={() => resetLesson()}>
              <RotateCcw aria-hidden="true" /> Restart
            </button>
          </div>

          <div className="lab-progress-row">
            <div className="lab-progress-copy">
              <span>
                {phase === "complete"
                  ? "Lesson complete"
                  : `Question ${questionIndex + 1} of ${lesson.questions.length}`}
              </span>
              <strong>{progress}%</strong>
            </div>
            <div
              className="lab-progress-track"
              role="progressbar"
              aria-label="Lesson progress"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress}
            >
              <span style={{ width: `${progress}%` }} />
            </div>
          </div>

          {phase !== "complete" ? (
            <article className="lab-question-card">
              <div className="lab-question-count">{String(questionIndex + 1).padStart(2, "0")}</div>
              <div className="lab-question-copy">
                <span>{question.eyebrow}</span>
                <h2>{question.title}</h2>
                <p>{question.prompt}</p>
              </div>
              <div className="lab-options">
                {question.options.map((option, index) => {
                  const selected = selectedAnswer === index;
                  const showResult = phase === "feedback";
                  const correct = index === question.answer;
                  return (
                    <button
                      type="button"
                      key={option}
                      className={`${selected ? "selected" : ""} ${showResult && correct ? "correct" : ""} ${showResult && selected && !correct ? "incorrect" : ""}`.trim()}
                      onClick={() => chooseAnswer(index)}
                      aria-pressed={selected}
                      disabled={phase !== "question"}
                    >
                      <span className="lab-option-key">{String.fromCharCode(65 + index)}</span>
                      <span>{option}</span>
                      <i aria-hidden="true">{showResult && correct ? <Check /> : null}</i>
                    </button>
                  );
                })}
              </div>
              {phase === "feedback" ? (
                <div className={`lab-insight ${isCorrect ? "correct" : "incorrect"}`} role="status">
                  <CheckCircle2 aria-hidden="true" />
                  <div>
                    <strong>{isCorrect ? "That’s it" : "Here’s the connection"}</strong>
                    <p>{question.insight}</p>
                  </div>
                </div>
              ) : null}
              <div className="lab-question-footer">
                <span>
                  {phase === "thinking"
                    ? "Evaluating your answer…"
                    : selectedAnswer === null
                      ? "Select one answer"
                      : "Answer selected"}
                </span>
                {phase === "feedback" ? (
                  <button className="lab-primary-button" type="button" onClick={continueLesson}>
                    {questionIndex === lesson.questions.length - 1
                      ? "See results"
                      : "Next question"}
                    <ArrowRight aria-hidden="true" />
                  </button>
                ) : (
                  <button
                    className="lab-primary-button"
                    type="button"
                    onClick={checkAnswer}
                    disabled={selectedAnswer === null || phase === "thinking"}
                  >
                    {phase === "thinking" ? "Thinking…" : "Check answer"}
                    <ArrowRight aria-hidden="true" />
                  </button>
                )}
              </div>
            </article>
          ) : (
            <article className="lab-complete-card">
              <span className="lab-complete-icon">
                <Sparkles aria-hidden="true" />
              </span>
              <span>Lesson complete</span>
              <h2>
                {score} out of {lesson.questions.length}
              </h2>
              <p>
                You finished {lesson.shortTitle.toLowerCase()} with {character.label}. Replay it, or
                choose another guide for a new lesson.
              </p>
              <div>
                <button className="lab-primary-button" type="button" onClick={() => resetLesson()}>
                  <RotateCcw aria-hidden="true" /> Replay lesson
                </button>
                <Link className="lab-secondary-button" to="/">
                  Explore the component <ArrowRight aria-hidden="true" />
                </Link>
              </div>
            </article>
          )}
        </section>

        <aside className="lab-coach" aria-label={`${character.label}, your learning guide`}>
          <div className="lab-section-label">
            <span>02</span>
            <p>Live guide response</p>
          </div>
          <div className="lab-guide-stage">
            <div className="lab-speech" aria-live="polite">
              <span>{character.label} says</span>
              <p>{coach.message}</p>
            </div>
            <MimoGuide
              key={character.id}
              character={character}
              expression={coach.expression}
              intensity={0.9}
              size={250}
              className="lab-guide-avatar"
              label={`${character.label} is ${coach.expression}`}
              expressionShiftCooldown={260}
              showExpressionEffects={coach.expression !== "thinking"}
            />
            <div className="lab-expression-pill">
              <i /> {coach.expression}
            </div>
          </div>
          <ol className="lab-state-flow" aria-label="Avatar reaction sequence">
            {statusSteps.map((step, index) => (
              <li key={step.label} className={step.active ? "active" : ""}>
                <span>{index + 1}</span>
                <p>{step.label}</p>
              </li>
            ))}
          </ol>
          <div className="lab-state-caption">
            <BookOpen aria-hidden="true" />
            <p>
              <strong>Controlled by lesson state</strong>No global listeners or animation timeline
              required.
            </p>
          </div>
        </aside>
      </main>
    </div>
  );
}
