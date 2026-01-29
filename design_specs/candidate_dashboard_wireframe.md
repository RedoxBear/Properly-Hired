# Design Spec: Candidate AI Dashboard Widget
**Target:** Wix Embed (Custom Element) & Local Preview
**User:** Job Candidate

## Layout Strategy
Since this lives inside a Wix "Strip" or "Container", it must be:
- **Fluid Width:** 100% width of parent container.
- **Self-Contained:** No external dependencies (fonts/icons bundled or standard).
- **Themeable:** Use CSS variables for colors so they can match the Wix site theme easily.

## Wireframe (Mobile First)

### State 1: Upload (Default)
[ Header: "Analyze Your Resume" ]
[ Subtext: "Upload your PDF to see if you match the job." ]
[ --------------------------------------------------- ]
[            Drop Zone (Dotted Border)                ]
[      (Icon: Cloud Upload) "Tap to Upload"           ]
[ --------------------------------------------------- ]
[ Button: "Analyze with AI" (Primary Color)           ]

### State 2: Processing (Loading)
[ Header: "AI is reading..." ]
[ Progress Bar: [==========      ] 70%                ]
[ Tip: "Did you know? Tailoring keywords increases..." ]

### State 3: Results (The "Scorecard")
[ Large Score Circle: "85%" (Green/Yellow/Red ring)   ]
[ Text: "Strong Match for Senior React Dev"           ]
-------------------------------------------------------
[ Section: Missing Skills (Red)                       ]
[  [!] TypeScript   [!] Unit Testing                  ]
-------------------------------------------------------
[ Section: Your Strengths (Green)                     ]
[  [✓] React        [✓] Communication                 ]
-------------------------------------------------------
[ Button: "Apply Now" (Primary)                       ]
[ Button: "Edit Resume" (Secondary)                   ]

## Interaction Notes
- **Upload:** Triggers API call to `POST /api/analyze`.
- **Error Handling:** If API fails (timeout/bad file), show clear red toast message inside the widget.
