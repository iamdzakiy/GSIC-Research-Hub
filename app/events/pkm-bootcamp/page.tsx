"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { getRegistrations, getTestResults, create, update } from "@/lib/firestore";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle,
  PenTool,
  Award,
  BookOpen,
  User,
  AlertCircle,
  Rocket,
  BarChart3,
} from "lucide-react";
import { useAuth } from "@/components/AuthContext";
import Navbar from "@/components/Navbar";
import {
  PKM_BOOTCAMP,
  SEED_TESTS,
  formatDate,
  daysUntil,
  getEventStatusColor,
  getEventStatusText,
  generateId,
} from "@/lib/data";
import { GSICEvent, Test, TestResult, Registration } from "@/lib/types";

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function PkmBootcampPage() {
  const { user, userProfile, loading, isAdmin } = useAuth();
  const [event, setEvent] = useState<GSICEvent>(PKM_BOOTCAMP);
  const [tests, setTests] = useState<Test[]>(SEED_TESTS);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // Pre-test / Post-test state
  const [activeTest, setActiveTest] = useState<"pre" | "post" | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [testResult, setTestResult] = useState<{ score: number; maxScore: number } | null>(null);

  // Registration form
  const [regForm, setRegForm] = useState({
    motivation: "",
  });

  useEffect(() => {
    loadData();
  }, []);

const loadData = async () => {
  try {
    const [regs, results] = await Promise.all([
      getRegistrations(),
      getTestResults(),
    ]);
    setRegistrations(regs);
    setTestResults(results);
  } catch (e) {
    console.error("Firestore load error:", e);
  }
};

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Check if user is registered
  const userRegistration = user
    ? registrations.find((r) => r.userId === user.uid && r.eventId === event.id)
    : null;

  const isRegistered = !!userRegistration;

  // Get test by type
  const getTest = (type: "pre" | "post"): Test | undefined => {
    return tests.find((t) => t.eventId === event.id && t.type === type);
  };

  // Check if user has completed a test
  const hasCompletedTest = (type: "pre" | "post"): boolean => {
    if (!user) return false;
    const test = getTest(type);
    if (!test) return false;
    return testResults.some(
      (r) => r.testId === test.id && r.userId === user.uid
    );
  };

  // Get user's test result
  const getUserTestResult = (type: "pre" | "post"): TestResult | null => {
    if (!user) return null;
    const test = getTest(type);
    if (!test) return null;
    return testResults.find((r) => r.testId === test.id && r.userId === user.uid) || null;
  };

  // ============================================================
  // HANDLERS
  // ============================================================
  const handleRegister = async () => {
  if (!user) { showToast("Please sign in to register.", "error"); return; }
  if (!regForm.motivation.trim()) { showToast("Please tell us your motivation.", "error"); return; }

  const newReg: Registration = {
    id: `reg-${generateId()}`,
    userId: user.uid,
    eventId: event.id,
    status: "confirmed",
    preTestCompleted: false,
    postTestCompleted: false,
    registeredAt: new Date().toISOString(),
  };

  try {
    await create("registrations", newReg);
    setRegistrations([...registrations, newReg]);
    showToast(`🎉 Registered for ${event.title}!`);
  } catch (e) {
    console.error(e);
    showToast("Failed to register.", "error");
  }
};

  const startTest = (type: "pre" | "post") => {
    if (!user) {
      showToast("Please sign in to take the test.", "error");
      return;
    }
    if (!isRegistered) {
      showToast("Please register for the event first.", "error");
      return;
    }
    if (hasCompletedTest(type)) {
      showToast(`You've already completed this test.`, "error");
      return;
    }

    const test = getTest(type);
    if (!test) {
      showToast("Test not found.", "error");
      return;
    }

    setActiveTest(type);
    setAnswers({});
    setTestResult(null);
  };

  const submitTest = async () => {
  if (!activeTest || !user) return;
  const test = getTest(activeTest);
  if (!test) return;

    // Check all questions answered
    const unanswered = test.questions.filter((q) => !answers[q.id]);
    if (unanswered.length > 0) {
      showToast(`Please answer all questions. ${unanswered.length} remaining.`, "error");
      return;
    }

    // Calculate score
    let score = 0;
    let maxScore = 0;
    test.questions.forEach((q) => {
      maxScore += q.points;
      if (q.type === "multiple_choice" && answers[q.id] === q.correctAnswer) {
        score += q.points;
      } else if (q.type === "essay") {
        // For essay questions, award full points if answered
        score += q.points;
      }
    });

    const newResult: TestResult = {
    id: `result-${generateId()}`,
    testId: test.id,
    userId: user.uid,
    answers: Object.entries(answers).map(([questionId, answer]) => ({ questionId, answer })),
    score, maxScore,
    completedAt: new Date().toISOString(),
  };

  try {
    // 1. Save test result to Firebase
    await create("testResults", newResult);
    setTestResults([...testResults, newResult]);

    // 2. Update registration status in Firebase
    if (userRegistration) {
      const patch: Partial<Registration> = {};
      if (activeTest === "pre") patch.preTestCompleted = true;
      else patch.postTestCompleted = true;
      
      await update("registrations", userRegistration.id, patch);
      setRegistrations(
        registrations.map((r) => r.id === userRegistration.id ? { ...r, ...patch } : r)
      );
    }

    setTestResult({ score, maxScore });
    setActiveTest(null);
    showToast(`✅ Test submitted! Score: ${score}/${maxScore}`);
  } catch (e) {
    console.error(e);
    showToast("Failed to submit test.", "error");
  }
};

  const cancelTest = () => {
    setActiveTest(null);
    setAnswers({});
    setTestResult(null);
  };

  // ============================================================
  // RENDER
  // ============================================================
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-hero-gradient">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#3352CD] to-[#5CE3B6] flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4 animate-pulse">
            G
          </div>
          <div className="text-white/60 font-body">Loading GSIC Hub...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-hero-gradient font-body pt-20">
      <Navbar />

      {/* Floating blobs */}
      <div className="fixed w-[500px] h-[500px] rounded-full bg-[#3352CD] opacity-[0.06] blur-[100px] pointer-events-none -top-[200px] -left-[200px] animate-float-blob z-0" />
      <div className="fixed w-[400px] h-[400px] rounded-full bg-[#5CE3B6] opacity-[0.06] blur-[100px] pointer-events-none -bottom-[150px] -right-[150px] animate-float-blob z-0" style={{ animationDelay: "8s" }} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        {/* ============================================================ */}
        {/* EVENT HEADER */}
        {/* ============================================================ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-3xl p-8 md:p-12 mb-8"
        >
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#3352CD] to-[#5CE3B6] flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-extrabold font-heading">
                    <span className="gradient-text">{event.title}</span>
                  </h1>
                  <p className="text-sm text-white/40 font-body mt-1">
                    {event.shortDescription}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-4">
                <span className={`text-xs px-3 py-1 rounded-full ${getEventStatusColor(event.status)}`}>
                  {getEventStatusText(event.status)}
                </span>
                <span className="text-xs bg-[#5CE3B6]/10 text-[#5CE3B6] px-3 py-1 rounded-full">
                  {event.type === "bootcamp" ? "Bootcamp" : "Sandbox"}
                </span>
                {/* Pre/Post Test Indicators */}
                {event.hasPreTest && (
                  <span className="text-xs bg-[#3352CD]/20 text-[#3352CD] px-3 py-1 rounded-full flex items-center gap-1">
                    <PenTool className="w-3 h-3" /> Pre-Test
                  </span>
                )}
                {event.hasPostTest && (
                  <span className="text-xs bg-[#F2F8C9]/20 text-[#F2F8C9] px-3 py-1 rounded-full flex items-center gap-1">
                    <Award className="w-3 h-3" /> Post-Test
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Event Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-[#5CE3B6]" />
                <div>
                  <div className="text-xs text-white/40">Start Date</div>
                  <div className="font-medium">{formatDate(event.startDate)}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-[#5CE3B6]" />
                <div>
                  <div className="text-xs text-white/40">End Date</div>
                  <div className="font-medium">{formatDate(event.endDate)}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-[#5CE3B6]" />
                <div>
                  <div className="text-xs text-white/40">Location</div>
                  <div className="font-medium">{event.location}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-[#5CE3B6]" />
                <div>
                  <div className="text-xs text-white/40">Participants</div>
                  <div className="font-medium">
                    {event.currentParticipants}/{event.maxParticipants}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-[#5CE3B6]" />
                <div>
                  <div className="text-xs text-white/40">Registration Deadline</div>
                  <div className="font-medium">
                    {formatDate(event.registrationDeadline)}
                    <span className={`text-xs ml-2 ${daysUntil(event.registrationDeadline) <= 7 ? "text-red-400" : "text-[#5CE3B6]"}`}>
                      ({daysUntil(event.registrationDeadline)} days left)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold font-heading mb-3">About This Event</h2>
              <p className="text-sm text-white/60 font-body leading-relaxed mb-4">
                {event.description}
              </p>

              {/* Pre/Post Test Explanations - shown at the beginning */}
              {event.hasPreTest && event.preTestExplanation && (
                <div className="glass rounded-xl p-4 mb-3 border-l-4 border-[#3352CD]">
                  <div className="flex items-start gap-2">
                    <PenTool className="w-4 h-4 text-[#3352CD] mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-xs font-semibold text-[#3352CD] uppercase tracking-wider mb-1">
                        Pre-Test Information
                      </div>
                      <p className="text-xs text-white/70 font-body leading-relaxed">
                        {event.preTestExplanation}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {event.hasPostTest && event.postTestExplanation && (
                <div className="glass rounded-xl p-4 mb-3 border-l-4 border-[#5CE3B6]">
                  <div className="flex items-start gap-2">
                    <Award className="w-4 h-4 text-[#5CE3B6] mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-xs font-semibold text-[#5CE3B6] uppercase tracking-wider mb-1">
                        Post-Test Information
                      </div>
                      <p className="text-xs text-white/70 font-body leading-relaxed">
                        {event.postTestExplanation}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Note: This event does NOT have pre/post tests */}
              {!event.hasPreTest && !event.hasPostTest && (
                <div className="glass rounded-xl p-4 border-l-4 border-[#5CE3B6]">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-[#5CE3B6] mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-xs font-semibold text-[#5CE3B6] uppercase tracking-wider mb-1">
                        Note
                      </div>
                      <p className="text-xs text-white/70 font-body leading-relaxed">
                        This event does not include pre-test or post-test assessments.
                        Just bring your curiosity and creativity!
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* ============================================================ */}
        {/* REGISTRATION / TEST SECTION */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Registration Panel */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="glass rounded-2xl p-6 md:p-8"
          >
            <h3 className="text-xl font-semibold flex items-center gap-2 mb-6 font-heading">
              <span className="w-8 h-8 rounded-full bg-[#5CE3B6]/20 flex items-center justify-center">
                <User className="w-4 h-4 text-[#5CE3B6]" />
              </span>
              {isRegistered ? "Your Registration" : "Register for Bootcamp"}
            </h3>

            {isRegistered ? (
              <div className="space-y-4">
                <div className="bg-white/5 rounded-xl p-4">
                  <div className="text-xs text-white/40 mb-1">Status</div>
                  <div className="font-medium text-[#5CE3B6]">
                    {userRegistration?.status === "confirmed" ? "✅ Confirmed" : userRegistration?.status}
                  </div>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <div className="text-xs text-white/40 mb-1">Pre-Test</div>
                  <div className="font-medium flex items-center gap-2">
                    {userRegistration?.preTestCompleted ? (
                      <span className="text-[#5CE3B6]">✅ Completed</span>
                    ) : (
                      <span className="text-white/40">Not yet taken</span>
                    )}
                  </div>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <div className="text-xs text-white/40 mb-1">Post-Test</div>
                  <div className="font-medium flex items-center gap-2">
                    {userRegistration?.postTestCompleted ? (
                      <span className="text-[#5CE3B6]">✅ Completed</span>
                    ) : (
                      <span className="text-white/40">Not yet available</span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleRegister();
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs text-white/40 mb-1.5 uppercase tracking-wider">
                    Your Name
                  </label>
                  <div className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white">
                    {userProfile?.name || user?.email || "Sign in to register"}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-white/40 mb-1.5 uppercase tracking-wider">
                    Motivation
                  </label>
                  <textarea
                    value={regForm.motivation}
                    onChange={(e) => setRegForm({ ...regForm, motivation: e.target.value })}
                    rows={3}
                    placeholder="Why do you want to join this bootcamp?"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/20 focus:outline-none focus:border-[#5CE3B6] focus:bg-white/5 transition resize-none"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-[#3352CD] to-[#4a6cf7] hover:from-[#4a6cf7] hover:to-[#5a7cff] transition font-medium py-3 rounded-xl shadow-lg shadow-[#3352CD]/30 flex items-center justify-center gap-2"
                >
                  <Rocket className="w-4 h-4" /> Register Now
                </button>
              </form>
            )}
          </motion.div>

          {/* Pre-Test / Post-Test Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Pre-Test */}
            {event.hasPreTest && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="glass rounded-2xl p-6 md:p-8"
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold flex items-center gap-2 font-heading">
                    <span className="w-7 h-7 rounded-full bg-[#3352CD]/20 flex items-center justify-center">
                      <PenTool className="w-3.5 h-3.5 text-[#3352CD]" />
                    </span>
                    Pre-Test
                    <span className="text-xs text-white/30 font-normal">
                      (before bootcamp)
                    </span>
                  </h4>
                  {hasCompletedTest("pre") && (
                    <div className="text-xs text-[#5CE3B6]">
                      ✅ Completed
                    </div>
                  )}
                </div>

                <p className="text-xs text-white/50 mb-4 font-body">
                  {event.preTestExplanation}
                </p>

                {activeTest === "pre" ? (
                  <div className="space-y-4">
                    {getTest("pre")?.questions.map((q) => (
                      <div key={q.id} className="bg-white/5 p-4 rounded-xl">
                        <p className="text-sm text-white/70 mb-3">{q.text}</p>
                        {q.type === "multiple_choice" && q.options && (
                          <div className="space-y-2">
                            {q.options.map((opt, i) => (
                              <label
                                key={i}
                                className="block text-xs text-white/60 py-1 cursor-pointer hover:text-white/80"
                              >
                                <input
                                  type="radio"
                                  name={q.id}
                                  value={opt}
                                  checked={answers[q.id] === opt}
                                  onChange={(e) =>
                                    setAnswers({ ...answers, [q.id]: e.target.value })
                                  }
                                  className="mr-2 accent-[#5CE3B6]"
                                />
                                {String.fromCharCode(65 + i)}) {opt}
                              </label>
                            ))}
                          </div>
                        )}
                        {q.type === "essay" && (
                          <textarea
                            value={answers[q.id] || ""}
                            onChange={(e) =>
                              setAnswers({ ...answers, [q.id]: e.target.value })
                            }
                            rows={3}
                            placeholder="Your answer..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-white/20 focus:outline-none focus:border-[#5CE3B6] resize-none text-sm"
                          />
                        )}
                      </div>
                    ))}
                    <div className="flex gap-3">
                      <button
                        onClick={submitTest}
                        className="flex-1 bg-gradient-to-r from-[#3352CD] to-[#4a6cf7] hover:from-[#4a6cf7] hover:to-[#5a7cff] transition px-5 py-2.5 rounded-full text-sm font-medium flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" /> Submit Pre-Test
                      </button>
                      <button
                        onClick={cancelTest}
                        className="px-5 py-2.5 rounded-full text-sm font-medium bg-white/10 hover:bg-white/20 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => startTest("pre")}
                    disabled={!isRegistered}
                    className="bg-gradient-to-r from-[#3352CD] to-[#4a6cf7] hover:from-[#4a6cf7] hover:to-[#5a7cff] transition px-5 py-2.5 rounded-full text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <PenTool className="w-4 h-4" /> Start Pre-Test
                  </button>
                )}
              </motion.div>
            )}

            {/* Post-Test */}
            {event.hasPostTest && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="glass rounded-2xl p-6 md:p-8"
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold flex items-center gap-2 font-heading">
                    <span className="w-7 h-7 rounded-full bg-[#5CE3B6]/20 flex items-center justify-center">
                      <Award className="w-3.5 h-3.5 text-[#5CE3B6]" />
                    </span>
                    Post-Test
                    <span className="text-xs text-white/30 font-normal">
                      (after bootcamp)
                    </span>
                  </h4>
                  {hasCompletedTest("post") && (
                    <div className="text-xs text-[#5CE3B6]">
                      ✅ Completed
                    </div>
                  )}
                </div>

                <p className="text-xs text-white/50 mb-4 font-body">
                  {event.postTestExplanation}
                </p>

                {activeTest === "post" ? (
                  <div className="space-y-4">
                    {getTest("post")?.questions.map((q) => (
                      <div key={q.id} className="bg-white/5 p-4 rounded-xl">
                        <p className="text-sm text-white/70 mb-3">{q.text}</p>
                        {q.type === "multiple_choice" && q.options && (
                          <div className="space-y-2">
                            {q.options.map((opt, i) => (
                              <label
                                key={i}
                                className="block text-xs text-white/60 py-1 cursor-pointer hover:text-white/80"
                              >
                                <input
                                  type="radio"
                                  name={q.id}
                                  value={opt}
                                  checked={answers[q.id] === opt}
                                  onChange={(e) =>
                                    setAnswers({ ...answers, [q.id]: e.target.value })
                                  }
                                  className="mr-2 accent-[#5CE3B6]"
                                />
                                {String.fromCharCode(65 + i)}) {opt}
                              </label>
                            ))}
                          </div>
                        )}
                        {q.type === "essay" && (
                          <textarea
                            value={answers[q.id] || ""}
                            onChange={(e) =>
                              setAnswers({ ...answers, [q.id]: e.target.value })
                            }
                            rows={3}
                            placeholder="Your answer..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-white/20 focus:outline-none focus:border-[#5CE3B6] resize-none text-sm"
                          />
                        )}
                      </div>
                    ))}
                    <div className="flex gap-3">
                      <button
                        onClick={submitTest}
                        className="flex-1 bg-gradient-to-r from-[#5CE3B6] to-[#3ab88a] hover:from-[#3ab88a] hover:to-[#5CE3B6] transition px-5 py-2.5 rounded-full text-sm font-medium flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" /> Submit Post-Test
                      </button>
                      <button
                        onClick={cancelTest}
                        className="px-5 py-2.5 rounded-full text-sm font-medium bg-white/10 hover:bg-white/20 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => startTest("post")}
                    disabled={!isRegistered || !userRegistration?.preTestCompleted}
                    className="bg-gradient-to-r from-[#5CE3B6] to-[#3ab88a] hover:from-[#3ab88a] hover:to-[#5CE3B6] transition px-5 py-2.5 rounded-full text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Award className="w-4 h-4" /> Start Post-Test
                  </button>
                )}
              </motion.div>
            )}

            {/* If event has no tests, show a note */}
            {!event.hasPreTest && !event.hasPostTest && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="glass rounded-2xl p-6 md:p-8"
              >
                <h4 className="font-semibold flex items-center gap-2 mb-4 font-heading">
                  <AlertCircle className="w-5 h-5 text-[#5CE3B6]" />
                  No Assessments
                </h4>
                <p className="text-sm text-white/60 font-body">
                  This event does not include pre-test or post-test assessments.
                  You can simply register and participate in the modules and activities.
                </p>
              </motion.div>
            )}
          </div>
        </div>

        {/* ============================================================ */}
        {/* MODULES */}
        {/* ============================================================ */}
        {event.modules.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-12"
          >
            <h3 className="text-xl font-semibold flex items-center gap-2 mb-6 font-heading">
              <BookOpen className="w-5 h-5 text-[#F2F8C9]" /> Event Modules
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {event.modules
                .slice()
                .sort((a, b) => a.order - b.order)
                .map((mod) => (
                  <div
                    key={mod.id}
                    className="glass rounded-2xl p-5 card-hover border-t-4 border-[#3352CD]"
                  >
                    <h4 className="text-base font-semibold font-heading mb-2">
                      {mod.title}
                    </h4>
                    <p className="text-xs text-white/50 mb-3 leading-relaxed font-body">
                      {mod.description}
                    </p>
                    <div className="flex justify-between text-xs text-white/40">
                      <span>⏱️ {mod.durationHours}h</span>
                      <span>
                        🏷️ {mod.cluster.charAt(0).toUpperCase() + mod.cluster.slice(1)}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </motion.div>
        )}

        {/* ============================================================ */}
        {/* SPEAKERS */}
        {/* ============================================================ */}
        {event.speakers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-12"
          >
            <h3 className="text-xl font-semibold flex items-center gap-2 mb-6 font-heading">
              <User className="w-5 h-5 text-[#F2F8C9]" /> Event Speakers
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {event.speakers.map((speaker, idx) => (
                <div
                  key={idx}
                  className="glass rounded-2xl p-5 text-center card-hover"
                >
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#3352CD]/30 to-[#5CE3B6]/30 flex items-center justify-center mx-auto mb-3">
                    <User className="w-8 h-8 text-[#5CE3B6]" />
                  </div>
                  <h4 className="font-semibold font-heading">{speaker.name}</h4>
                  <p className="text-xs text-white/50 mt-1">{speaker.title}</p>
                  <p className="text-xs text-white/40 mt-1">{speaker.organization}</p>
                  <p className="text-xs text-[#5CE3B6] mt-2">"{speaker.topic}"</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ============================================================ */}
        {/* PROGRESS TRACKER (if registered and has tests) */}
        {/* ============================================================ */}
        {isRegistered && (event.hasPreTest || event.hasPostTest) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-12 glass rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-4 font-heading">
              <BarChart3 className="w-5 h-5 text-[#5CE3B6]" /> Your Progress
            </h3>
            <div className="space-y-3">
              {event.hasPreTest && (
                <div className="flex items-center justify-between">
                  <span className="text-sm">Pre-Test</span>
                  {hasCompletedTest("pre") ? (
                    <span className="text-[#5CE3B6] text-sm">
                      ✅ {getUserTestResult("pre")?.score}/{getUserTestResult("pre")?.maxScore} points
                    </span>
                  ) : (
                    <span className="text-white/40 text-sm">Not taken</span>
                  )}
                </div>
              )}
              {event.hasPostTest && (
                <div className="flex items-center justify-between">
                  <span className="text-sm">Post-Test</span>
                  {hasCompletedTest("post") ? (
                    <span className="text-[#5CE3B6] text-sm">
                      ✅ {getUserTestResult("post")?.score}/{getUserTestResult("post")?.maxScore} points
                    </span>
                  ) : (
                    <span className="text-white/40 text-sm">Not taken</span>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </main>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 px-6 py-3.5 rounded-2xl glass border ${
            toast.type === "success" ? "border-[#5CE3B6]" : "border-red-400"
          } text-white font-medium z-50 shadow-2xl backdrop-blur-xl flex items-center gap-2`}
        >
          <span>{toast.type === "success" ? "✅" : "❌"}</span>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
