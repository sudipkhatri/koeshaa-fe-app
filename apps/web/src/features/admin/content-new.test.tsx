import { fireEvent, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { API, server } from "@/test/server";

import { renderAdmin } from "./admin-test-utils";
import { ContentNewScreen } from "./ContentNewScreen";

const GRADE = "01J9Z8Y7X6W5V4T3S2R1Q0P9G9";
const MATH = "01J9Z8Y7X6W5V4T3S2R1Q0P9S1";
const ORG = "01J9Z8Y7X6W5V4T3S2R1Q0P9A1";
const CHAPTER = "01J9Z8Y7X6W5V4T3S2R1Q0P9H1";
const TOPIC = "01J9Z8Y7X6W5V4T3S2R1Q0P9T1";
const IDEA = "01J9Z8Y7X6W5V4T3S2R1Q0P9I1";
const QUESTION = "01J9Z8Y7X6W5V4T3S2R1Q0P9Q1";
const REVIEW = "01J9Z8Y7X6W5V4T3S2R1Q0P9V1";
const RELEASE = "01J9Z8Y7X6W5V4T3S2R1Q0P9R8";

function listed(data: unknown[]) {
  return HttpResponse.json({
    success: true,
    data,
    meta: { pagination: { limit: 20, offset: 0, total: data.length } },
  });
}

function created(id: string) {
  return HttpResponse.json(
    {
      success: true,
      data: { id, entity_type: "question", review_id: REVIEW, content_release_id: RELEASE },
    },
    { status: 201 },
  );
}

describe("add a question", () => {
  it("creates the levels, then the question, and approves the review", async () => {
    const question: unknown[] = [];
    const decisions: unknown[] = [];
    server.use(
      http.get(`${API}/api/v1/curriculum/subjects`, () =>
        listed([
          {
            id: MATH,
            grade_level_id: GRADE,
            stream_id: null,
            code: "MAT9",
            name: "Mathematics",
            curriculum_order: 1,
          },
        ]),
      ),
      http.get(`${API}/api/v1/curriculum/grade-levels`, () =>
        listed([
          {
            id: GRADE,
            code: "9",
            name: "Class 9",
            sort_order: 9,
            has_streams: false,
            final_exam_name: "",
          },
        ]),
      ),
      http.get(`${API}/api/v1/me/schools`, () =>
        HttpResponse.json({
          success: true,
          data: [
            {
              organisation_id: ORG,
              name: "Keoshaa",
              kind: "school",
              status: "active",
              role: "admin",
              joined_at: "2026-01-01T00:00:00Z",
            },
          ],
        }),
      ),
      http.get(`${API}/api/v1/content/releases`, () =>
        listed([
          {
            id: RELEASE,
            subject_id: MATH,
            version: 8,
            notes: null,
            published_at: null,
            published_by: null,
            created_at: "2026-11-01T04:15:00Z",
          },
        ]),
      ),
      http.post(`${API}/api/v1/content/chapters`, () => created(CHAPTER)),
      http.post(`${API}/api/v1/content/topics`, () => created(TOPIC)),
      http.post(`${API}/api/v1/content/concepts`, () => created(IDEA)),
      http.post(`${API}/api/v1/content/questions`, async ({ request }) => {
        question.push(await request.json());
        return created(QUESTION);
      }),
      http.post(`${API}/api/v1/content/reviews/:id/submit`, () =>
        HttpResponse.json({ success: true, data: { id: REVIEW, status: "submitted" } }),
      ),
      http.post(`${API}/api/v1/content/reviews/:id/decision`, async ({ request }) => {
        decisions.push(await request.json());
        return HttpResponse.json({ success: true, data: { id: REVIEW, status: "approved" } });
      }),
    );
    renderAdmin(<ContentNewScreen />);
    expect(await screen.findByRole("heading", { name: "Add a question" })).toBeTruthy();
    fireEvent.click(await screen.findByLabelText("Subject"));
    fireEvent.click(await screen.findByRole("option", { name: "Mathematics · Class 9" }));

    fireEvent.change(screen.getByLabelText("Number"), { target: { value: "4" } });
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Quadratic equations" } });
    fireEvent.click(screen.getByRole("button", { name: "Add the chapter" }));
    fireEvent.change(await screen.findByLabelText("Short code"), { target: { value: "square" } });
    fireEvent.change(screen.getAllByLabelText("Number")[0]!, { target: { value: "2" } });
    fireEvent.change(screen.getAllByLabelText("Name")[0]!, {
      target: { value: "Completing the square" },
    });
    fireEvent.change(screen.getByLabelText("Question it answers"), { target: { value: "How?" } });
    fireEvent.change(screen.getByLabelText("Overview"), { target: { value: "Squares." } });
    fireEvent.click(screen.getByRole("button", { name: "Add the topic" }));

    fireEvent.change(await screen.findByRole("textbox", { name: "Idea" }), {
      target: { value: "A perfect square" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add the idea" }));
    expect(await screen.findAllByText("A perfect square")).toHaveLength(2);

    fireEvent.change(screen.getByRole("textbox", { name: "Question" }), {
      target: { value: "What is added?" },
    });
    fireEvent.change(screen.getByLabelText("Option 1"), { target: { value: "3" } });
    fireEvent.change(screen.getByLabelText("Option 2"), { target: { value: "9" } });
    fireEvent.click(screen.getByLabelText("Correct option 2"));
    fireEvent.change(screen.getByLabelText("Labels"), { target: { value: "algebra" } });
    fireEvent.change(screen.getByLabelText("Checked by"), { target: { value: "Anil Bhandari" } });
    expect(screen.getByRole("button", { name: "Add to v8" })).toBeTruthy();
    fireEvent.submit(document.getElementById("add-question") as HTMLFormElement);

    await waitFor(() => expect(question).toHaveLength(1));
    expect(question[0]).toMatchObject({
      idea_id: IDEA,
      organisation_id: ORG,
      kind: "single",
      source: "book",
      language: "en",
      stem: "What is added?",
      options: { choices: ["3", "9"] },
      answer_key: { correct: [1] },
    });
    expect(question[0]).not.toHaveProperty("labels");
    expect(JSON.stringify(question[0])).not.toContain("Anil");
    await waitFor(() => expect(decisions.length).toBeGreaterThanOrEqual(1));
    expect(
      decisions.every((item) => JSON.stringify(item) === JSON.stringify({ decision: "approved" })),
    ).toBe(true);
    expect(await screen.findByText(/Added\./)).toBeTruthy();
  });

  it("asks for a place before it saves", async () => {
    server.use(
      http.get(`${API}/api/v1/curriculum/subjects`, () => listed([])),
      http.get(`${API}/api/v1/curriculum/grade-levels`, () => listed([])),
      http.get(`${API}/api/v1/me/schools`, () => HttpResponse.json({ success: true, data: [] })),
      http.get(`${API}/api/v1/content/releases`, () => listed([])),
    );
    renderAdmin(<ContentNewScreen />);
    fireEvent.change(await screen.findByLabelText("Question"), {
      target: { value: "What is added?" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add the question" }));
    expect(await screen.findByText(/Add the subject/)).toBeTruthy();
    expect(screen.getByLabelText("Question")).toHaveProperty("value", "What is added?");
  });
});
