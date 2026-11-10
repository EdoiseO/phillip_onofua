export function HomeAbout() {
  return (
    <section id="about" className="section about" aria-labelledby="about-title">
      <div className="about-intro">
        <p className="eyebrow">03 / A little about me</p>
        <h2 id="about-title">Curious about the whole picture.</h2>
        <div className="profile">
          <img
            src="/assets/profile-photo.jpg"
            width="64"
            height="64"
            alt="Phillip Onofua"
            loading="lazy"
          />
          <div>
            <strong>Phillip Onofua</strong>
            <span>North York, Toronto</span>
          </div>
        </div>
        <section className="languages" aria-labelledby="languages-title">
          <h3 id="languages-title" className="mono">
            Languages
          </h3>
          <div className="language-group">
            <p className="language-label">Core stack</p>
            <ul className="language-list">
              <li>
                <a
                  href="https://github.com/EdoiseO/student-market-of-toronto"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="JavaScript: view Student Market source"
                >
                  <img
                    src="/assets/tech-logos/javascript.svg"
                    width="20"
                    height="20"
                    alt=""
                    loading="lazy"
                    decoding="async"
                  />
                  <span>JavaScript (ES6+)</span>
                </a>
              </li>
              <li>
                <img
                  src="/assets/tech-logos/typescript.svg"
                  width="20"
                  height="20"
                  alt=""
                  loading="lazy"
                  decoding="async"
                />
                <span>TypeScript</span>
              </li>
              <li>
                <a
                  href="https://github.com/EdoiseO/COMP2152_Assignment-1"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Python: view a course project"
                >
                  <img
                    src="/assets/tech-logos/python.svg"
                    width="20"
                    height="20"
                    alt=""
                    loading="lazy"
                    decoding="async"
                  />
                  <span>Python</span>
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/EdoiseO/student-market-of-toronto/tree/main/supabase/migrations"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="SQL: view Student Market database migrations"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <ellipse cx="12" cy="5.5" rx="7" ry="3"></ellipse>
                    <path d="M5 5.5v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"></path>
                    <path d="M5 11.5v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"></path>
                  </svg>
                  <span>SQL</span>
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/EdoiseO/phillip_onofua/blob/main/src/pages/Home.jsx"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="HTML: view portfolio markup"
                >
                  <img
                    src="/assets/tech-logos/html5.svg"
                    width="16"
                    height="16"
                    alt=""
                    loading="lazy"
                    decoding="async"
                  />
                  <span>HTML5</span>
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/EdoiseO/phillip_onofua/blob/main/public/assets/home.css"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="CSS: view portfolio styles"
                >
                  <img
                    src="/assets/tech-logos/css3.svg"
                    width="16"
                    height="16"
                    alt=""
                    loading="lazy"
                    decoding="async"
                  />
                  <span>CSS3</span>
                </a>
              </li>
            </ul>
          </div>
          <div className="language-group">
            <p className="language-label">Additional languages</p>
            <ul className="language-list language-list--secondary">
              <li>
                <a
                  href="https://github.com/EdoiseO/COMP3074-RestaurantGuide"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Kotlin: view the Restaurant Guide project"
                >
                  <img
                    src="/assets/tech-logos/kotlin.svg"
                    width="20"
                    height="20"
                    alt=""
                    loading="lazy"
                    decoding="async"
                  />
                  <span>Kotlin</span>
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/EdoiseO/COMP2080_Group_Project_2026_TIKTACTOE/blob/master/MinimaxAI.java"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Java: view the group Tic-Tac-Toe minimax code"
                >
                  <img
                    src="/assets/tech-logos/java.svg"
                    width="20"
                    height="20"
                    alt=""
                    loading="lazy"
                    decoding="async"
                  />
                  <span>Java</span>
                </a>
              </li>
              <li>
                <img
                  src="/assets/tech-logos/csharp.svg"
                  width="20"
                  height="20"
                  alt=""
                  loading="lazy"
                  decoding="async"
                />
                <span>C#</span>
              </li>
              <li>
                <img
                  src="/assets/tech-logos/cplusplus.svg"
                  width="20"
                  height="20"
                  alt=""
                  loading="lazy"
                  decoding="async"
                />
                <span>C++</span>
              </li>
              <li>
                <img
                  src="/assets/tech-logos/php.svg"
                  width="16"
                  height="16"
                  alt=""
                  loading="lazy"
                  decoding="async"
                />
                <span>PHP</span>
              </li>
            </ul>
          </div>
        </section>
      </div>
      <div className="about-copy">
        <p>
          I’m a Computer Programming and Analysis student at George Brown Polytechnic. I like
          working across the whole product: understanding a problem, designing the interface, and
          making the underlying systems work together.
        </p>
        <p>
          Most of what I build starts as something I wanted to exist — then I take it further than I
          need to, because that’s where I learn the most.
        </p>
        <div id="education" className="education">
          <span className="mono">EDUCATION / EXPECTED 2027</span>
          <h3>George Brown Polytechnic</h3>
          <p>Computer Programming and Analysis</p>
          <span className="education-detail">
            Full-stack development · Database design · Data structures · Software quality assurance
          </span>
        </div>
        <p className="ai-disclosure">
          I use AI coding assistants like ChatGPT and Claude to move faster, and I own the design
          and every line I ship. I’m happy to walk through any of it.
        </p>
      </div>
    </section>
  );
}
