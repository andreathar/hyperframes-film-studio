/** Render saved job intent for one explicitly selected shot. No provider transport. */
export function renderJobControls({ doc, parent, shotKey, jobs, jobError, submit }) {
  const make = (tag, text, className) => {
    const node = doc.createElement(tag);
    if (text !== undefined) node.textContent = String(text);
    if (className) node.className = className;
    return node;
  };
  const field = (
    form,
    label,
    id,
    { tag = "input", value = "", type = "text", max = 20000 } = {},
  ) => {
    const input = make(tag);
    input.id = id;
    input.name = id;
    input.required = true;
    if (tag === "input") input.type = type;
    if (type === "number") {
      input.min = "1";
      input.max = String(max);
      input.step = "1";
    } else {
      input.maxLength = max;
      input.setAttribute("autocapitalize", "off");
      input.setAttribute("autocorrect", "off");
      input.spellcheck = tag === "textarea";
    }
    if (tag === "textarea") input.rows = 3;
    input.value = value;
    const caption = make("label", label);
    caption.htmlFor = id;
    form.append(caption, input);
    return input;
  };
  const form = (container, label, path, payload) => {
    const node = make("form");
    node.method = "post";
    node.action = path;
    container.append(node);
    const finish = () => {
      const button = make("button", label, "primary");
      button.type = "submit";
      node.append(button);
      node.addEventListener("submit", (event) => {
        event.preventDefault();
        if (node.reportValidity()) void submit(path, payload());
      });
    };
    return { node, finish };
  };
  if (jobError) {
    parent.append(make("p", jobError + " Use Reload session to retry.", "muted"));
    return;
  }
  if (!jobs?.enabled) {
    parent.append(
      make(
        "p",
        "Job tracking is not connected. Start the inspector with an existing job store to prepare and record local intent.",
        "muted",
      ),
    );
    return;
  }
  const revision = make("p", "Saved jobs · revision " + jobs.revision, "selection");
  revision.id = "job-revision";
  parent.append(revision);
  parent.append(
    make(
      "p",
      "Jobs save automatically. Preparing intent does not run a provider. Reported outputs remain candidates.",
      "muted",
    ),
  );
  const list = make("div", undefined, "job-list");
  const matching = jobs.jobs.filter((job) => job.shotKey === shotKey);
  const labels = {
    prepared: "Prepared intent",
    unknown: "Outcome unknown",
    "reported-running": "Reported running",
    "reported-failed": "Reported failed",
    "reported-succeeded": "Reported succeeded",
  };
  for (const [index, job] of matching.entries()) {
    const row = make("article", undefined, "job-row");
    row.dataset.jobId = job.id;
    row.tabIndex = -1;
    row.append(make("h4", job.id), make("p", labels[job.state] || job.state, "selection"));
    row.append(
      make("p", job.route + " · " + job.model, "muted"),
      make("p", job.prompt, "job-prompt"),
    );
    const output = job.output;
    row.append(
      make(
        "p",
        `${output.width} × ${output.height}${output.kind === "video" ? ` · ${output.fps} fps · ${output.durationFrames} frames` : " · image"} · ${job.referenceCount} reference(s)`,
        "muted",
      ),
    );
    if (job.externalId) row.append(make("p", "External task: " + job.externalId, "muted"));
    row.append(
      make(
        "p",
        `${job.observationCount} observation(s) · ${job.outputCount} candidate output(s)`,
        "muted",
      ),
    );
    if (!["reported-succeeded", "reported-failed"].includes(job.state)) {
      if (jobs.canObserve) {
        const detail = make("details");
        detail.append(make("summary", "Record a saved receipt"));
        row.append(detail);
        const receiptForm = form(detail, "Record receipt", "/api/jobs/observe", () => ({
          jobId: job.id,
          receiptPath: path.value,
          reason: reason.value,
        }));
        const path = field(
          receiptForm.node,
          "Receipt path relative to results workspace (required)",
          "job-receipt-" + index,
          { max: 2000 },
        );
        const reason = field(receiptForm.node, "Reason (required)", "job-receipt-reason-" + index, {
          tag: "textarea",
        });
        receiptForm.finish();
      } else
        row.append(
          make("p", "Receipt recording needs a results workspace configured at startup.", "muted"),
        );
    }
    list.append(row);
  }
  if (!matching.length) list.append(make("p", "No saved jobs for this shot.", "muted"));
  parent.append(list);
  const create = make("details");
  create.id = "job-create";
  create.append(make("summary", "Prepare video job intent"));
  create.append(
    make(
      "p",
      "All fields are required. Route and model are intent labels; confirm provider capabilities separately. Review the editable output defaults before saving.",
      "muted",
    ),
  );
  parent.append(create);
  const createForm = form(create, "Save video job intent", "/api/jobs/prepare", () => ({
    request: {
      id: id.value,
      shotKey,
      route: route.value,
      model: model.value,
      prompt: prompt.value,
      output: {
        kind: "video",
        width: Number(width.value),
        height: Number(height.value),
        fps: Number(fps.value),
        durationFrames: Number(frames.value),
      },
    },
    reason: reason.value,
  }));
  const id = field(createForm.node, "Job ID (required, unique)", "job-id", { max: 200 });
  const route = make("select");
  route.id = "job-route";
  route.name = "job-route";
  route.required = true;
  for (const [value, label] of [
    ["kling-cli", "Kling CLI intent"],
    ["higgsfield-manual", "Higgsfield manual intent"],
    ["comfyui-manual", "ComfyUI manual intent"],
    ["local-manual", "Local model manual intent"],
  ]) {
    const option = make("option", label);
    option.value = value;
    route.append(option);
  }
  const routeLabel = make("label", "Route intent (required)");
  routeLabel.htmlFor = route.id;
  createForm.node.append(routeLabel, route);
  const model = field(createForm.node, "Model intent (required)", "job-model");
  const prompt = field(createForm.node, "Prompt (required)", "job-prompt", { tag: "textarea" });
  const output = make("fieldset");
  output.append(make("legend", "Video output intent"));
  createForm.node.append(output);
  const width = field(output, "Width (pixels)", "job-width", {
    type: "number",
    value: "1920",
    max: 16384,
  });
  const height = field(output, "Height (pixels)", "job-height", {
    type: "number",
    value: "1080",
    max: 16384,
  });
  const fps = field(output, "Frames per second", "job-fps", {
    type: "number",
    value: "24",
    max: 120,
  });
  const frames = field(output, "Duration (frames)", "job-frames", {
    type: "number",
    value: "96",
    max: 86400,
  });
  const reason = field(createForm.node, "Reason (required)", "job-reason", { tag: "textarea" });
  createForm.finish();
}
