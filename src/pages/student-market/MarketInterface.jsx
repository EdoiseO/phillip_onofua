export function MarketInterface() {
  return (
    <section
      className="case-study-gallery-section"
      id="interface-gallery"
      aria-labelledby="interface-gallery-title"
    >
      <div className="case-study-gallery-heading">
        <div>
          <p className="eyebrow">The product in practice</p>
          <h2 id="interface-gallery-title">See the exchange from every side.</h2>
        </div>
        <p>
          Browse the marketplace, follow a conversation, or explore the moderation tools. Each group
          opens the real desktop and mobile interfaces, with full-size images and zoom controls.
        </p>
      </div>
      <div
        className="case-study-gallery-groups"
        role="list"
        aria-label="Student Market implementation galleries"
      >
        <article role="listitem">
          <button
            className="case-study-gallery-card"
            type="button"
            data-gallery-group="marketplace"
          >
            <span className="case-study-gallery-cover">
              <img
                src="/assets/student-market-browse-desktop.png"
                alt=""
                width="1440"
                height="1000"
                loading="lazy"
              />
            </span>{' '}
            <span className="case-study-gallery-card-copy">
              <strong>Marketplace and listings</strong>{' '}
              <span>Browse listings, view seller details, and see available actions.</span>
            </span>
          </button>
        </article>
        <article role="listitem">
          <button className="case-study-gallery-card" type="button" data-gallery-group="messaging">
            <span className="case-study-gallery-cover">
              <img
                src="/assets/student-market-conversation-desktop.png"
                alt=""
                width="1470"
                height="670"
                loading="lazy"
              />
            </span>{' '}
            <span className="case-study-gallery-card-copy">
              <strong>Messaging and media</strong>{' '}
              <span>
                Conversations tied to listings, with attachments, reactions, and preserved history.
              </span>
            </span>
          </button>
        </article>
        <article role="listitem">
          <button className="case-study-gallery-card" type="button" data-gallery-group="profiles">
            <span className="case-study-gallery-cover">
              <img
                src="/assets/student-market-public-profile-desktop.png"
                alt=""
                width="1084"
                height="983"
                loading="lazy"
              />
            </span>{' '}
            <span className="case-study-gallery-card-copy">
              <strong>Profiles and accounts</strong>{' '}
              <span>
                Public seller identity and authenticated profile controls backed by shared account
                data.
              </span>
            </span>
          </button>
        </article>
        <article role="listitem">
          <button className="case-study-gallery-card" type="button" data-gallery-group="admin">
            <span className="case-study-gallery-cover">
              <img
                src="/assets/student-market-report-review-current-desktop.png"
                alt=""
                width="1470"
                height="1823"
                loading="lazy"
              />
            </span>{' '}
            <span className="case-study-gallery-card-copy">
              <strong>Admin and moderation</strong>{' '}
              <span>
                Operational registries, evidence review, seller feedback, private notes, decisions,
                and enforcement.
              </span>
            </span>
          </button>
        </article>
        <article role="listitem">
          <button className="case-study-gallery-card" type="button" data-gallery-group="mobile">
            <span className="case-study-gallery-cover case-study-gallery-cover--mobile">
              <img
                src="/assets/student-market-messages-mobile.png"
                alt=""
                width="390"
                height="844"
                loading="lazy"
              />
            </span>{' '}
            <span className="case-study-gallery-card-copy">
              <strong>Mobile application</strong>{' '}
              <span>
                Responsive browse, listing-linked messaging, and student profile workflows.
              </span>
            </span>
          </button>
        </article>
        <article role="listitem">
          <button className="case-study-gallery-card" type="button" data-gallery-group="data-model">
            <span className="case-study-gallery-cover">
              <img
                src="/assets/student-market-data-model-overview.jpg"
                alt=""
                width="1140"
                height="786"
                loading="lazy"
              />
            </span>{' '}
            <span className="case-study-gallery-card-copy">
              <strong>Relational data model</strong>{' '}
              <span>
                Connected marketplace, messaging, notification, moderation, and account-lifecycle
                records.
              </span>
            </span>
          </button>
        </article>
      </div>
    </section>
  );
}
