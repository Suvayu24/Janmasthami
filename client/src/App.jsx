import { useEffect, useMemo, useState } from "react";
import { AdminLoginPage } from "./AdminAuthPages.jsx";
import { useAdminAuth } from "./auth.js";
import { ButterPotMotif, PeacockFeatherMotif, FluteMotif } from "./motifs.jsx";

const events = [
  {
    title: "Dance",
    type: "Rhythm meets celebration",
    image: "/assets/dance.jpg",
    wheelImage: "/assets/pastime-1.jpg",
    alt: "Dance event",
    description:
      "Classical and festive performances bring Krishna's stories to life through movement, colour, and stage energy."
  },
  {
    title: "Music",
    type: "Melodies that lift the heart",
    image: "/assets/music.jpg",
    wheelImage: "/assets/pastime-2.jpg",
    alt: "Music event",
    description:
      "Live devotional melodies, percussion, and chorus moments set the tone for an evening of shared celebration."
  },
  {
    title: "Bhajan Clubbing",
    type: "Where bhajans meet the beat",
    image: "/assets/bhajan-clubbing.webp",
    wheelImage: "/assets/pastime-3.jpg",
    alt: "Bhajan clubbing event",
    description:
      "The main attraction blends familiar bhajans with concert-like energy, lights, and collective participation."
  },
  {
    title: "Drama",
    type: "Stories come alive on stage",
    image: "/assets/drama.jpg",
    wheelImage: "/assets/pastime-4.jpg",
    alt: "Drama event",
    description:
      "A theatrical retelling of mythological moments with expressive characters, costumes, and campus stagecraft."
  },
  {
    title: "Abhishek",
    type: "A sacred Janmashtami experience",
    image: "/assets/abhishek.jpg",
    wheelImage: "/assets/pastime-5.jpg",
    alt: "Abhishek event",
    description: "A devotional abhishek ceremony invites the audience into the spiritual centre of the evening."
  },
  {
    title: "Prasadam",
    type: "Celebrate, connect, receive",
    image: "/assets/prasadam.jpg",
    wheelImage: "/assets/pastime-6.jpg",
    alt: "Prasadam event",
    description:
      "The celebration closes with prasadam distribution, gathering everyone together after the performances."
  }
];

// The wheel is divided into one equal segment per event (360deg / count).
// Item 0 is placed at 0deg (due east / horizontal), which is also the
// point of the wheel that sits furthest out from behind the cropped left
// edge -- i.e. the most visible, "horizontal" spot on the ring.
const wheelSegmentCount = events.length;
const wheelSpokeAngle = 360 / wheelSegmentCount;

const schedule = [
  ["5:00 PM", "Commencement and Welcome", "Opening lamp-lighting, welcome note, and invocation."],
  ["5:15 PM", "Abhishek", "A devotional ceremony to begin the celebration with reverence."],
  ["5:45 PM", "Dance", "Classical and festive choreography inspired by Krishna leela."],
  ["6:10 PM", "Drama", "Stage storytelling with mythological scenes and character-led moments."],
  ["6:40 PM", "Music", "Devotional vocals, instruments, and audience-led chorus sections."],
  ["7:05 PM", "Bhajan Clubbing", "The main attraction: bhajans, beats, lights, and a full-audience finale."],
  ["7:45 PM", "Prasadam", "Prasadam distribution and closing gathering."]
];

const initialForm = {
  name: "",
  amountContributed: "",
  rollNumber: "",
  roomNumber: "",
  phoneNumber: "",
  anonymous: false
};

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(Number(amount || 0));
}

function Header({ funding = false }) {
  const homePrefix = funding ? "/" : "";
  const { isAdmin, logout } = useAdminAuth();

  function handleLogout() {
    logout();
    window.location.href = "/";
  }

  return (
    <header className={`site-header${funding ? " funding-header" : ""}`} aria-label="Festival navigation">
      <a className="brand" href="/" aria-label="Janmashtami festival home">
        {/* <span className="brand-mark">Wellness Club</span> */}
        {/* <span>Janmashtami</span> */}
      </a>
      <nav className="nav-links" aria-label="Primary">
        <a href={`${homePrefix}#events`}>Events</a>
        <a href={`${homePrefix}#schedule`}>Schedule</a>
        {/* <a href={`${homePrefix}#venue`}>Venue</a> */}
        <a href="/crowdfunding">Crowd Funding</a>
        {/* "Admin Login" is the only auth link surfaced here — normal
            visitors get no benefit from logging in, so registration isn't
            advertised in the navbar. */}
        {isAdmin ? (
          <button type="button" onClick={handleLogout}>
            Admin Logout
          </button>
        ) : (
          <a href="/admin-login">Admin Login</a>
        )}
      </nav>
    </header>
  );
}

function HomePage() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [activeEvent, setActiveEvent] = useState(0);
  const [chakraRotation, setChakraRotation] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % events.length);
    }, 4600);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const chakraSection = document.querySelector(".chakra-scroll");
    let ticking = false;

    function clamp(value, min, max) {
      return Math.min(Math.max(value, min), max);
    }

    function updateChakraScroll() {
      if (!chakraSection) return;

      const rect = chakraSection.getBoundingClientRect();
      const scrollable = chakraSection.offsetHeight - window.innerHeight;
      const rawProgress = clamp(-rect.top / scrollable, 0, 1);
      const maxEventIndex = wheelSegmentCount - 1;

      // The wheel makes one full rotation across the whole scroll range.
      // Because each item starts at index * wheelSpokeAngle (item 0 at
      // 0deg / horizontal), this rotation guarantees item[i] passes
      // exactly through the horizontal position at rawProgress === i / count
      // -- the same instant its segment becomes active below. Rotation and
      // active-segment are therefore always perfectly synchronised.
      setChakraRotation(rawProgress * -360);

      // Segment-based logic: the scroll range is split into one equal
      // segment per event. Whichever segment we're in stays the active
      // event until the next image swings into the horizontal position.
      const segmentIndex = clamp(Math.floor(rawProgress * wheelSegmentCount), 0, maxEventIndex);
      setActiveEvent(segmentIndex);
    }

    function requestUpdate() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        updateChakraScroll();
        ticking = false;
      });
    }

    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    updateChakraScroll();

    return () => {
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
    };
  }, []);

  return (
    <>
      <Header />
      <main>
        <section className="hero" id="home" aria-label="Janmashtami Youth Festival">
          <div className="carousel" aria-label="Event image carousel">
            {events.map((event, index) => (
              <img
                className={`carousel-slide${index === activeSlide ? " is-active" : ""}`}
                src={event.image}
                alt={event.alt}
                key={event.title}
              />
            ))}
          </div>

          <div className="hero-overlay"></div>

          {/* <PeacockFeatherMotif className="motif--hero" /> */}

          <div className="carousel-controls" aria-label="Carousel controls">
            <button
              className="carousel-btn"
              type="button"
              onClick={() => setActiveSlide((activeSlide - 1 + events.length) % events.length)}
              aria-label="Previous image"
            >
              &lsaquo;
            </button>
            <div className="carousel-dots" aria-label="Select image">
              {events.map((event, index) => (
                <button
                  className={`carousel-dot${index === activeSlide ? " is-active" : ""}`}
                  type="button"
                  aria-label={`Show ${event.title}`}
                  aria-pressed={index === activeSlide}
                  onClick={() => setActiveSlide(index)}
                  key={event.title}
                />
              ))}
            </div>
            <button
              className="carousel-btn"
              type="button"
              onClick={() => setActiveSlide((activeSlide + 1) % events.length)}
              aria-label="Next image"
            >
              &rsaquo;
            </button>
          </div>

          <div className="hero-content">
            <p className="eyebrow">Wellness Club Presents</p>
            <h1>Janmashtami Youth Festival 2026</h1>
            <p className="hero-copy">
              An evening where devotion meets performance: dance, drama, music, abhishek, prasadam, and a vibrant
              bhajan clubbing finale for the IIIT Allahabad community.
            </p>
            <div className="hero-actions">
              <a className="primary-link" href="#events">Explore Events</a>
              <a className="secondary-link" href="/crowdfunding">Support the Festival</a>
            </div>
          </div>

          <div className="hero-meta" aria-label="Festival quick details">
            <span>Saturday, 05 September 2026</span>
            <span>5:00 PM - 8:00 PM</span>
            <span>IIITA Main Auditorium</span>
          </div>
        </section>

        <section className="intro-section" aria-label="Festival overview">
          {/* <ButterPotMotif className="motif--intro" /> */}
          <div className="section-shell intro-grid">
            <div>
              <p className="section-kicker">Celebrate Krishna. Celebrate Together.</p>
              <h2>A campus evening shaped by rhythm, devotion, and community.</h2>
            </div>
            <p>
              The festival brings six experiences into one flowing celebration. Scroll through to discover
              every event, then continue to the full evening schedule and venue details.
            </p>
          </div>
        </section>

        <section className="chakra-scroll" id="events" aria-label="Scroll through festival events">
          <div className="chakra-sticky">
            <div className="chakra-art" aria-hidden="true">
              <div className="wheel-ring">
                <div className="wheel-halo"></div>
                <div className="wheel-glow"></div>

                <div className="wheel-rotor" style={{ "--chakra-rotation": `${chakraRotation.toFixed(2)}deg` }}>
                  <svg className="wheel-ring-svg" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="47" fill="none" stroke="rgba(180, 138, 58, 0.42)" strokeWidth="0.6" />
                    <circle
                      cx="50"
                      cy="50"
                      r="41"
                      fill="none"
                      stroke="rgba(180, 138, 58, 0.28)"
                      strokeWidth="0.5"
                      strokeDasharray="0.6 3.6"
                    />
                    {events.map((event, index) => {
                      const angle = (index * wheelSpokeAngle) * (Math.PI / 180);
                      const x1 = 50 + 41 * Math.cos(angle);
                      const y1 = 50 + 41 * Math.sin(angle);
                      const x2 = 50 + 47 * Math.cos(angle);
                      const y2 = 50 + 47 * Math.sin(angle);
                      return (
                        <line
                          key={event.title}
                          x1={x1}
                          y1={y1}
                          x2={x2}
                          y2={y2}
                          stroke="rgba(180, 138, 58, 0.55)"
                          strokeWidth="0.7"
                        />
                      );
                    })}
                  </svg>

                  {events.map((event, index) => (
                    <div
                      className={`wheel-item${index === activeEvent ? " is-active" : ""}`}
                      style={{ "--item-angle": `${index * wheelSpokeAngle}deg` }}
                      key={event.title}
                    >
                      <img src={event.wheelImage} alt={event.alt} />
                    </div>
                  ))}
                </div>

                {/* <div className="wheel-hub">
                  <FluteMotif className="motif-flute" />
                  <PeacockFeatherMotif className="motif-feather" />
                </div> */}
              </div>
            </div>

            <div className="event-stage">
              <p className="section-kicker">The Six Festival Moments</p>
              <div className="event-copy-stack">
                {events.map((event, index) => (
                  <article className={`event-panel${index === activeEvent ? " is-active" : ""}`} key={event.title}>
                    <span className="event-count">{String(index + 1).padStart(2, "0")} / 06</span>
                    <img src={event.image} alt={event.alt} />
                    <div>
                      <p className="event-type">{event.type}</p>
                      <h2>{event.title}</h2>
                      <p>{event.description}</p>
                    </div>
                  </article>
                ))}
              </div>

              <div className="event-progress" aria-label="Event progress">
                {events.map((event, index) => (
                  <span className={`progress-dot${index === activeEvent ? " is-active" : ""}`} key={event.title}></span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="schedule-section" id="schedule" aria-label="Festival schedule">
          {/* <FluteMotif className="motif--schedule" /> */}
          <div className="section-shell">
            <div className="schedule-heading">
              <p className="section-kicker">Evening Plan</p>
              <h2>Schedule, Date, Time, and Venue</h2>
            </div>

            <div className="detail-strip" id="venue">
              <div>
                <span className="detail-label">Date</span>
                <strong>Saturday, 05 September 2026</strong>
              </div>
              <div>
                <span className="detail-label">Time</span>
                <strong>5:00 PM - 8:00 PM</strong>
              </div>
              <div>
                <span className="detail-label">Venue</span>
                <strong>IIITA Main Auditorium</strong>
              </div>
            </div>

            <div className="timeline" aria-label="Time wise order of events">
              {schedule.map(([time, title, description]) => (
                <article className={`timeline-item${title === "Bhajan Clubbing" ? " featured" : ""}`} key={title}>
                  <time>{time}</time>
                  <div>
                    <h3>{title}</h3>
                    <p>{description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

function CrowdfundingPage() {
  const { admin, isAdmin, logout } = useAdminAuth();
  const [funding, setFunding] = useState({ totalFunds: 0, leaderboard: [], contributors: [] });
  const [form, setForm] = useState(initialForm);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const topTen = useMemo(() => funding.leaderboard || [], [funding.leaderboard]);

  async function loadContributors() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/contributors");
      if (!response.ok) throw new Error("Could not load contributors");
      setFunding(await response.json());
    } catch (fetchError) {
      setError(fetchError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadContributors();
  }, []);

  function updateField(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value
    }));
  }

  async function submitContributor(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/contributors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(admin?.token ? { Authorization: `Bearer ${admin.token}` } : {})
        },
        body: JSON.stringify({
          ...form,
          amountContributed: Number(form.amountContributed)
        })
      });

      const result = await response.json();
      if (!response.ok) {
        // Token missing/expired — drop the stale session so the button
        // disappears again instead of the admin hitting this repeatedly.
        if (response.status === 401) logout();
        throw new Error(result.message || "Could not add contributor");
      }

      setForm(initialForm);
      setModalOpen(false);
      await loadContributors();
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Header funding />
      <main className="crowdfunding-page">
        <section className="funding-hero section-shell">
          <div>
            <p className="section-kicker">Festival Crowd Funding</p>
            <h1>Support Janmashtami at IIIT Allahabad</h1>
          </div>
          <div className="funding-total-panel">
            <span>Total Funds Raised</span>
            <strong>{formatCurrency(funding.totalFunds)}</strong>
            {isAdmin && (
              <button className="primary-link button-link" type="button" onClick={() => setModalOpen(true)}>
                Add Contributor
              </button>
            )}
          </div>
        </section>

        <section className="leaderboard-section section-shell" aria-label="Crowd funding leaderboard">
          <div className="leaderboard-heading">
            <div>
              <p className="section-kicker">Top 10</p>
              <h2>Contributor Leaderboard</h2>
            </div>
            <span>{funding.contributors.length} total contributors</span>
          </div>

          {error && <p className="status-message error-message">{error}</p>}
          {loading && <p className="status-message">Loading contributors...</p>}

          {!loading && (
            <div className="leaderboard-table-wrap">
              <table className="leaderboard-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Name</th>
                    <th>Roll Number</th>
                    <th>Room</th>
                    <th>Facilitator</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {topTen.length === 0 && (
                    <tr>
                      <td colSpan="6" className="empty-table">No contributors yet.</td>
                    </tr>
                  )}
                  {topTen.map((contributor, index) =>
                    contributor.anonymous ? (
                      <tr className="anonymous-row" key={contributor.id}>
                        <td>{index + 1}</td>
                        <td colSpan="4">Anonymous contributor</td>
                        <td className="amount-cell">{formatCurrency(contributor.amountContributed)}</td>
                      </tr>
                    ) : (
                      <tr key={contributor.id}>
                        <td>{index + 1}</td>
                        <td>{contributor.name}</td>
                        <td>{contributor.rollNumber}</td>
                        <td>{contributor.roomNumber}</td>
                        <td>{contributor.facilitatorName}</td>
                        <td className="amount-cell">{formatCurrency(contributor.amountContributed)}</td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {modalOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setModalOpen(false)}>
          <section className="contributor-modal" role="dialog" aria-modal="true" aria-labelledby="contributor-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="modal-heading">
              <div>
                <p className="section-kicker">New Contributor</p>
                <h2 id="contributor-title">Add Funding Details</h2>
              </div>
              <button className="modal-close" type="button" onClick={() => setModalOpen(false)} aria-label="Close form">
                X
              </button>
            </div>

            <form className="contributor-form" onSubmit={submitContributor}>
              <label>
                <span>Name</span>
                <input name="name" value={form.name} onChange={updateField} placeholder="Contributor name" required />
              </label>
              <label>
                <span>Amount Contributed</span>
                <input
                  name="amountContributed"
                  type="number"
                  min="1"
                  value={form.amountContributed}
                  onChange={updateField}
                  placeholder="2500"
                  required
                />
              </label>
              <label>
                <span>Roll Number</span>
                <input name="rollNumber" value={form.rollNumber} onChange={updateField} placeholder="IIT2026001" required />
              </label>
              <label>
                <span>Room Number</span>
                <input name="roomNumber" value={form.roomNumber} onChange={updateField} placeholder="BH5-5412" required />
              </label>
              <label>
                <span>Phone Number</span>
                <input name="phoneNumber" value={form.phoneNumber} onChange={updateField} placeholder="9876543210" required />
              </label>
              <label className="checkbox-row">
                <input name="anonymous" type="checkbox" checked={form.anonymous} onChange={updateField} />
                <span>Keep this contribution anonymous on the public leaderboard</span>
              </label>

              <div className="form-actions">
                <button className="secondary-action" type="button" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button className="primary-link button-link" type="submit" disabled={saving}>
                  {saving ? "Adding..." : "Add Contributor"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      <Footer />
    </>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <p>Janmashtami Youth Festival 2026 &middot; Wellness Club, IIIT Allahabad</p>
      <a href="/">Back to home</a>
    </footer>
  );
}

export default function App() {
  const path = window.location.pathname;

  if (path === "/crowdfunding") return <CrowdfundingPage />;
  if (path === "/admin-login") return <AdminLoginPage />;
  return <HomePage />;
}
