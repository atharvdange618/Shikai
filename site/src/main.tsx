import { useState, type KeyboardEvent } from "react";
import { createRoot } from "react-dom/client";

import actions from "../assets/tour/actions.webp";
import diff from "../assets/tour/diff.webp";
import pullRequest from "../assets/tour/pull-request.webp";
import repository from "../assets/tour/repository.webp";
import search from "../assets/tour/search.webp";
import widget from "../assets/tour/widget.webp";

const iconPaths = {
  pull: "M6 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm0 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm0-14v10m12 4a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm0-4v-6a4 4 0 0 0-4-4h-2m2-3-3 3 3 3",
  diff: "M8 7 3 12l5 5m8-10 5 5-5 5m-3-13-2 16",
  actions: "M3 12h4l3-7 4 14 3-7h4",
  repo: "M5 19V5a2 2 0 0 1 2-2h12v18H7a2 2 0 0 1 0-4h12M9 7h6",
  search: "M15.5 15.5 21 21M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z",
  widget: "M3 3h7v7H3zm11 0h7v7h-7zM3 14h7v7H3zm11 0h7v7h-7z",
};

function Icon({ name }: { name: keyof typeof iconPaths }) {
  return (
    <svg className="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d={iconPaths[name]} />
    </svg>
  );
}

const workflow = [
  {
    id: "pull",
    label: "Pull request",
    heading: "Get the whole PR at a glance.",
    text: "See the merge state and check results, then jump straight to changed files, review threads, or commits.",
    source: pullRequest,
    alt: "Shikai PR overview with the merge state and links to files changed, review threads, commits, and checks.",
    width: 840,
    height: 1378,
  },
  {
    id: "diff",
    label: "Diff",
    heading: "Read the exact lines that changed.",
    text: "Open a file in the diff viewer for syntax highlighting, old and new line numbers, and a toggle to wrap long lines.",
    source: diff,
    alt: "Shikai diff viewer showing added and removed lines with syntax highlighting and paired line numbers.",
    width: 960,
    height: 1380,
  },
  {
    id: "actions",
    label: "Actions",
    heading: "See where a workflow landed.",
    text: "Check the run result, branch, and duration. Open a job to see its logs when you need more detail.",
    source: actions,
    alt: "A passing Shikai CI run with its duration, branch, commit, and check job.",
    width: 840,
    height: 978,
  },
] as const;

function Workflow() {
  const [active, setActive] = useState(0);

  function handleTabKey(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const last = workflow.length - 1;
    let destination: number;
    switch (event.key) {
      case "ArrowLeft":
        destination = index === 0 ? last : index - 1;
        break;
      case "ArrowRight":
        destination = index === last ? 0 : index + 1;
        break;
      case "Home":
        destination = 0;
        break;
      case "End":
        destination = last;
        break;
      default:
        return;
    }

    event.preventDefault();
    setActive(destination);
    event.currentTarget.parentElement
      ?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
      [destination]?.focus();
  }

  return (
    <section className="workflow" aria-labelledby="workflow-title">
      <h2 id="workflow-title">From pull request to CI.</h2>
      <div className="workflow-stage">
        <div className="workflow-tabs" role="tablist" aria-label="Explore a pull request">
          {workflow.map((view, index) => (
            <button
              key={view.id}
              type="button"
              id={`tab-${view.id}`}
              role="tab"
              aria-controls={`panel-${view.id}`}
              aria-selected={active === index}
              tabIndex={active === index ? 0 : -1}
              onClick={() => setActive(index)}
              onKeyDown={(event) => handleTabKey(event, index)}
            >
              <Icon name={view.id} />
              {view.label}
            </button>
          ))}
        </div>
        {workflow.map((view, index) => (
          <div
            key={view.id}
            id={`panel-${view.id}`}
            role="tabpanel"
            aria-labelledby={`tab-${view.id}`}
            hidden={active !== index}
            tabIndex={0}
            className="workflow-panel"
          >
            <div className="workflow-copy">
              <h3>{view.heading}</h3>
              <p>{view.text}</p>
            </div>
            {active === index && (
              <img
                className="workflow-screen"
                src={view.source}
                width={view.width}
                height={view.height}
                alt={view.alt}
                loading="lazy"
              />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

const features = [
  {
    id: "repo",
    heading: "Open a repo and get your bearings.",
    text: "Go from repo details to code, recent commits, releases, or discussions without leaving Shikai.",
    source: repository,
    alt: "The public Shikai repo with its topics, repo stats, and navigation to code, pull requests, releases, and Actions.",
    width: 840,
    height: 1680,
  },
  {
    id: "search",
    heading: "Find what you came for.",
    text: "Search GitHub by repo, user, issue, or topic. Issue search uses an optional personal access token.",
    source: search,
    alt: "Shikai Search showing public React Native repositories and tabs for repos, users, issues, and topics.",
    width: 840,
    height: 1608,
  },
  {
    id: "widget",
    heading: "Put your streak on your home screen.",
    text: "The Android widget shows your current streak and recent contributions without opening the app.",
    source: widget,
    alt: "Shikai's widget on the Android launcher showing a 12-day streak and a contribution graph.",
    width: 960,
    height: 570,
  },
] as const;

function ProductTour() {
  return (
    <>
      <Workflow />
      <section className="features" aria-labelledby="features-title">
        <h2 id="features-title">Explore GitHub from your phone.</h2>
        <div className="feature-grid">
          {features.map((feature) => (
            <article className={`feature feature-${feature.id}`} key={feature.id}>
              <div className="feature-copy">
                <Icon name={feature.id} />
                <h3>{feature.heading}</h3>
                <p>{feature.text}</p>
              </div>
              <div className="feature-art">
                <img
                  src={feature.source}
                  width={feature.width}
                  height={feature.height}
                  alt={feature.alt}
                  loading="lazy"
                />
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

const tour = document.getElementById("tour");
if (tour) createRoot(tour).render(<ProductTour />);
