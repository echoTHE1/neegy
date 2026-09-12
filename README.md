# Nexus Connect

BUILD A COMPLETE PRIVATE GROUP CHAT PLATFORM

Create a production-quality real-time private group chat web application called NEXUS.

This should NOT be a simple demo, landing-page mockup, or static UI.

Build the complete working application from frontend to backend, including real-time messaging, private rooms, invite-code access, usernames, room management, animations, responsive design, error handling, loading states, and persistent data.

The overall experience should feel like a futuristic combination of:

Discord

iMessage

modern gaming interfaces

cyberpunk HUD interfaces

futuristic operating systems

premium SaaS applications

The application should be visually impressive immediately when someone opens it.

1. CORE IDEA

NEXUS allows people to create private group conversations.

A user creates a room.

NEXUS generates a unique room access code.

Example:

NXS-7K4-P92

The creator sends that code to their friends.

Friends open NEXUS, enter:

Their display name

The room code

They are then placed into the private group chat.

There should be NO public room browser.

There should be NO list of discoverable rooms.

A user should need the correct invite/access code to enter a room.

2. BRANDING

Application name:

NEXUS

Primary tagline:

PRIVATE CONVERSATIONS. ONE CODE AWAY.

Secondary tagline:

Connect without the clutter.

Logo concept:

A futuristic geometric N/X symbol combined with a glowing digital connection/network symbol.

The logo should have:

subtle glow

animated gradient

futuristic appearance

clean geometry

no generic stock-chat icon

Use a consistent visual identity throughout the entire application.

3. VISUAL STYLE

The entire website should use a premium dark futuristic interface.

Do NOT make this look like:

a generic Bootstrap dashboard

a basic Discord clone

a plain React template

a generic AI-generated website

Make it feel intentionally designed.

Background

Use a very dark background.

Possible base:

#05060A

Layer subtle effects over it:

animated radial gradients

moving light

subtle grid

tiny particles

soft noise texture

blurred glowing shapes

extremely subtle scanlines

The background should have movement, but it must remain readable.

4. COLOR SYSTEM

Primary colors:

electric cyan

neon blue

violet

purple

white

Use gradients such as:

cyan → blue → violet

Do not make every element glow heavily.

Use glow strategically.

Example:

Normal button:
dark translucent background

Hover:
slightly brighter border

Active:
soft cyan/purple glow

5. TYPOGRAPHY

Use a modern combination of fonts.

Suggested:

Display font:
Orbitron

UI font:
Inter

Secondary/technical font:
JetBrains Mono

Use Orbitron sparingly for:

NEXUS logo

major headings

invite codes

futuristic status labels

Use Inter for normal interface text.

Use JetBrains Mono for:

room codes

technical status

timestamps where appropriate

system messages

6. LANDING PAGE

Create a cinematic landing page.

When the page loads:

Background fades in.

Particles begin moving.

NEXUS logo slowly appears.

Logo glow activates.

Main heading fades upward.

Buttons slide upward.

Background network lines subtly animate.

Do not make the animation take several seconds.

The site should become usable quickly.

Landing Page Layout

Center the main content.

Large logo:

NEXUS

Heading:

PRIVATE CONVERSATIONS.

Second line:

ONE CODE AWAY.

Description:

Create a private group and invite people using a unique access code.

Buttons:

CREATE CHAT

JOIN CHAT

Secondary text:

No public rooms. No room discovery. Just your people.

7. CREATE CHAT SCREEN

When the user clicks CREATE CHAT:

Use a smooth page transition.

Display a glassmorphism card.

Title:

CREATE A NEW NEXUS

Subtitle:

Start a private conversation and invite your group.

Fields:

Display Name

Placeholder:

What should people call you?

Group Name

Placeholder:

Give your group a name

Example:

Weekend Crew

Optional:

Group Description

Placeholder:

What's this group about?

Button:

CREATE ROOM

8. INPUT DESIGN

Inputs should NOT look like default HTML inputs.

Use:

translucent background

subtle border

rounded corners

inner shadow

animated focus border

soft glow

On focus:

border smoothly brightens

background becomes slightly lighter

subtle glow appears

Validation should happen visually.

Do NOT use ugly browser alerts.

9. ROOM CREATION

When CREATE ROOM is pressed:

Show a futuristic loading state.

Example:

INITIALIZING NEXUS...

Then:

GENERATING SECURE ROOM...

Then:

ROOM READY

Keep this animation short.

Generate a cryptographically strong random room code.

Example format:

NXS-8K4-2P7

Requirements:

unique

difficult to guess

human-readable

case-insensitive when entered

server validated

stored securely

Never rely solely on frontend-generated authorization.

10. INVITE CODE SCREEN

Before entering the chat, show a beautiful invite-code screen.

Large card:

YOUR ROOM IS READY

Group:

Weekend Crew

Access code:

NXS-8K4-2P7

Make the code huge and visually important.

Add:

COPY CODE

button.

Also:

SHARE CODE

if the browser supports the Web Share API.

When copied:

The button changes to:

✓ COPIED

with a smooth animation.

The code should briefly glow.

11. IMPORTANT SECURITY CONCEPT

The invite code should identify the room.

However, do NOT treat a predictable room code as a sufficient security boundary.

Implement server-side authorization and validation.

Use sufficiently random codes.

Do not expose database credentials in frontend code.

Do not put private service keys into JavaScript bundles.

Validate all room access on the backend.

12. JOIN CHAT

The JOIN CHAT page should be just as polished.

Title:

JOIN A NEXUS

Subtitle:

Enter your name and the access code you received.

Inputs:

YOUR NAME

ROOM CODE

Room code example:

NXS-8K4-2P7

Button:

ENTER ROOM

Add:

BACK

button.

13. ROOM CODE INPUT

Automatically format the room code while typing.

Example:

User types:

nxs8k42p7

Interface displays:

NXS-8K4-2P7

Normalize codes on the backend so capitalization and formatting don't cause unnecessary failures.

14. INVALID ROOM

If the code does not exist:

Display an animated notification:

ROOM NOT FOUND

Then:

That NEXUS code doesn't match an active room.

Do not reload the page.

Keep the entered name/code available so the user can correct it.

15. CHAT APPLICATION

After entering the room, transition into the main NEXUS interface.

Desktop layout:

┌────────────────────────────────────────────────────────────┐
│ NEXUS              GROUP NAME                MEMBERS        │
├──────────────┬─────────────────────────────────┬───────────┤
│              │                                 │           │
│ ROOM INFO    │          MESSAGES               │ MEMBERS   │
│              │                                 │           │
│ Invite Code  │                                 │ ● Alex    │
│              │                                 │ ● Jordan  │
│ Settings     │                                 │ ○ Sam     │
│              │                                 │           │
│ Leave        │                                 │           │
│              ├─────────────────────────────────┤           │
│              │ MESSAGE...                 SEND │           │
└──────────────┴─────────────────────────────────┴───────────┘


Do not literally use ASCII in the interface.

16. CHAT HEADER

Header should contain:

Left:

NEXUS icon

Group name

Online status

Example:

WEEKEND CREW

4 ONLINE

Right:

Invite

Members

Settings

More

buttons

Buttons should use icons with tooltips.

17. MESSAGE AREA

Messages should appear in a clean chronological feed.

Current user's messages:

Align right.

Other users:

Align left.

Each message can contain:

avatar/initial

username

message

timestamp

optional reactions

Example:

Alex

Anyone playing tonight?

6:42 PM

18. MESSAGE ANIMATIONS

When a message appears:

opacity 0 → 1

slight vertical movement

slight scale

smooth easing

Do NOT use excessive bouncing.

For messages sent by the current user:

Subtle slide from the right.

For incoming messages:

Subtle slide from the left.

19. MESSAGE COMPOSER

Bottom of chat should contain a premium message composer.

Features:

text input

emoji button

send button

optional attachment button

character limit indicator if appropriate

Placeholder:

Message #Weekend Crew

Send button should activate when text exists.

Pressing Enter sends the message.

Shift + Enter creates a new line.

20. TYPING INDICATOR

Implement real-time typing indicators.

Example:

Alex is typing...

Animation:

● ● ●

The dots should animate sequentially.

If multiple users are typing:

Alex and Jordan are typing...

For many users:

Several people are typing...

Automatically stop typing status after inactivity.

21. REAL-TIME MESSAGING

This is critical.

Messages must actually synchronize between different browser windows/devices.

Do NOT fake this using:

localStorage

setTimeout

static JSON

fake messages

frontend-only state

Use a real backend with real-time synchronization.

Possible stack:

Frontend:

React

TypeScript

Vite or Next.js

Backend/database:

Supabase

Firebase

or another proper real-time backend

Use whichever backend integrates cleanly with the project.

22. DATABASE DESIGN

Create appropriate database structures.

Suggested:

rooms

Fields:

id

name

description

invite_code_hash or secure invite identifier

owner_id/session identifier

created_at

updated_at

active

members

Fields:

id

room_id

display_name

joined_at

last_seen

online status

messages

Fields:

id

room_id

member_id

message

created_at

edited_at

deleted_at

Use relationships correctly.

Add indexes for room/message lookups.

23. SESSION SYSTEM

A user should not need a complicated account just to join a temporary room.

Use an anonymous/session identity if appropriate.

The application should remember:

current session

current room

display name

But do not store unnecessary personal information.

If persistent accounts are implemented, make them optional.

24. MEMBER SYSTEM

The member panel should show:

ONLINE

and:

OFFLINE

members.

Each user should have an automatically generated avatar based on their initials or generated abstract icon.

Example:

CP

Do not require users to upload profile photos.

25. ONLINE PRESENCE

Use real-time presence if the backend supports it.

Show:

Green/active indicator for online users.

When someone disconnects:

Update their status.

Do not permanently mark someone online if their connection disappears.

26. ROOM OWNER

The room creator becomes the owner.

Owner controls:

Rename room

Change description

Regenerate invite code

Remove members

Clear messages

Delete room

Clearly distinguish owner controls from normal member controls.

Do not allow ordinary members to access owner-only operations.

27. REMOVE MEMBER

If the owner removes a member:

Show confirmation first.

Example:

REMOVE MEMBER?

Jordan will be disconnected from this room.

Buttons:

CANCEL

REMOVE

Use a smooth modal.

28. DELETE ROOM

Deleting a room is destructive.

Require confirmation.

Example:

DELETE ROOM?

This will permanently remove the room and its messages.

Buttons:

CANCEL

DELETE ROOM

Do not allow accidental deletion through a single click.

29. REGENERATE INVITE CODE

Room owner can generate a new invite code.

When regenerated:

Old code stops working.

Display:

NEW ACCESS CODE GENERATED

Show the new code.

Animate the old code fading away and the new code appearing.

30. MESSAGE FEATURES

Implement:

Reply

Click message → Reply.

Composer displays:

Replying to Alex

with a small preview.

Reactions

Allow basic reactions:

👍
❤️
😂
🔥
😮
🎉

Show reaction counts.

Copy

Copy message text.

Show:

MESSAGE COPIED

Edit

Allow users to edit their own messages.

Display:

edited

after modification.

Delete

Allow users to delete their own messages.

Do not silently delete without updating the interface.

31. MESSAGE CONTEXT MENU

On desktop:

Right-click or menu button.

Options:

Reply

React

Copy

Edit

Delete

depending on permissions.

On mobile:

Use a bottom-sheet menu instead of a desktop context menu.

32. SYSTEM MESSAGES

Use special system messages for events.

Examples:

Alex joined the room

Jordan left the room

Room invite code regenerated

Make system messages visually different from normal messages.

33. NOTIFICATIONS

Build custom toast notifications.

Examples:

✓ Message sent

✓ Invite code copied

✓ Room created

⚠ Connection interrupted

✓ Reconnected

Toasts should slide/fade in and automatically disappear.

Do not use browser alert dialogs.

34. CONNECTION STATUS

Display connection state somewhere subtle.

Connected:

● CONNECTED

Connecting:

◌ CONNECTING

Disconnected:

○ OFFLINE

Reconnecting:

↻ RECONNECTING

Use appropriate animation.

If the connection drops, messages should not silently fail.

Show the user what is happening.

35. LOADING STATES

Every async operation needs a proper loading state.

Examples:

Room creation:

CREATING ROOM...

Joining:

CONNECTING TO ROOM...

Messages:

Skeleton message placeholders.

Members:

Skeleton member rows.

Do not freeze the page.

36. ERROR HANDLING

Never allow raw errors to appear in the UI.

Convert errors into understandable messages.

Example database failure:

Instead of:

PostgrestError: 401...

show:

CONNECTION ERROR

We couldn't reach the room. Try again.

Provide:

RETRY

37. MOBILE DESIGN

The mobile version must be designed intentionally.

Do NOT simply shrink the desktop layout.

On mobile:

hide the permanent sidebars

use drawers

use bottom sheets

optimize message bubbles

keep composer fixed to bottom

make buttons touch-friendly

avoid tiny text

support safe areas

handle mobile keyboards correctly

Mobile header:

NEXUS

GROUP NAME

•••

Members can open from a drawer.

38. RESPONSIVE BREAKPOINTS

Support:

large desktop

desktop

tablet

mobile

small mobile

Make sure nothing overlaps.

Test long group names.

Test long usernames.

Test long messages.

Test very small screens.

39. ANIMATED PAGE TRANSITIONS

Moving between:

Landing → Create

Landing → Join

Join → Chat

Create → Invite

should have smooth transitions.

Use:

fade

slide

blur

scale

Keep transitions around a few hundred milliseconds.

Avoid slow cinematic transitions that interfere with usability.

40. BACKGROUND ANIMATION

Create an animated background system.

Ideas:

tiny floating particles

connection lines

slowly moving gradient blobs

grid movement

subtle glowing nodes

The animation should run efficiently.

Respect:

prefers-reduced-motion

If reduced motion is enabled, significantly reduce animations.

41. MICRO-INTERACTIONS

Every major interactive element should feel responsive.

Examples:

Button hover:

slight lift

glow

Button press:

slight scale down

Input focus:

border glow

Copy:

icon changes

Send:

button pulse

New message:

subtle entrance

Member joining:

small notification animation

Room deletion:

controlled confirmation animation

42. GLASSMORPHISM

Use glass panels carefully.

Example:

Background:

rgba(255,255,255,0.03)

Border:

rgba(255,255,255,0.08)

Backdrop blur.

Do not make the entire UI transparent.

Important information must remain readable.

43. FUTURISTIC HUD ELEMENTS

Add subtle technical UI elements around major screens.

Examples:

NXS // SECURE CHANNEL

ROOM STATUS // ACTIVE

NODE // CONNECTED

ENCRYPTED SESSION

These should be decorative and subtle.

Do not claim the application provides encryption that it does not actually implement.

44. DASHBOARD / HOME

If a session exists, the landing screen can optionally show:

WELCOME BACK

and:

REJOIN LAST ROOM

However, never expose room codes publicly.

Allow the user to leave the room/session.

45. ROOM REJOIN

If the user refreshes the page:

Attempt to restore the current room session if valid.

If the session is no longer valid:

Return them to the landing/join screen with a friendly message.

46. EMPTY ROOM

When a room has no messages:

Display an elegant empty state.

Example:

THE CHANNEL IS QUIET

Send the first message and start the conversation.

Use a subtle animated network icon.

47. EMPTY MEMBER STATE

If only the creator is present:

You're the only one here.

Share the invite code to bring people in.

Button:

COPY INVITE CODE

48. INVITE PANEL

Create a dedicated invite modal.

Title:

INVITE TO NEXUS

Display:

NXS-8K4-2P7

Buttons:

COPY CODE

SHARE

Optional:

SHOW QR

If QR functionality is implemented, generate it client-side without exposing sensitive backend credentials.

49. SETTINGS

Create a polished settings modal/drawer.

Sections:

Appearance

Reduce animations

Compact messages

Show timestamps

Notifications

Enable sound

Desktop notifications where supported

Account / Identity

Display name

Room

Invite code

Leave room

Owner additionally gets:

Manage members

Rename room

Regenerate code

Delete room

50. SOUND DESIGN

If implemented, keep sounds extremely subtle.

Examples:

message received

message sent

notification

member joined

Provide:

SOUND ON

SOUND OFF

Do not automatically play intrusive audio.

Respect browser autoplay restrictions.

51. ACCESSIBILITY

The interface must remain accessible.

Implement:

keyboard navigation

visible focus states

semantic buttons

accessible labels

screen-reader-friendly controls

sufficient contrast

reduced-motion support

proper modal focus handling

Do not rely solely on color to communicate state.

52. SECURITY

Implement reasonable security throughout the application.

Requirements:

Server-side room validation

Input validation

Message sanitization

Rate limiting where possible

Database row-level security if using Supabase

Environment variables for secrets

No service-role keys in frontend

No trust in client-provided room ownership

Validate member permissions server-side

Prevent unauthorized room access

Prevent unauthorized message deletion/editing

Prevent injection attacks

Never put sensitive credentials in:

HTML

React components

public environment variables

GitHub repository

53. SPAM PROTECTION

Implement reasonable message rate limiting.

If a user sends too many messages too quickly:

Show:

SLOW DOWN

You're sending messages too quickly.

Do not permanently punish the user for a temporary burst.

54. MESSAGE LENGTH

Set a reasonable maximum message length.

If exceeded:

MESSAGE TOO LONG

Provide a character counter if useful.

Do not allow enormous payloads to be submitted to the backend.

55. USERNAME VALIDATION

Username rules:

required

reasonable maximum length

trim whitespace

prevent empty names

prevent inappropriate control characters

escape HTML

preserve normal spaces

Do not allow someone to impersonate a system message through formatting.

56. ROOM NAME VALIDATION

Room names should:

have a reasonable maximum length

be trimmed

reject empty names

safely render user input

57. NO PUBLIC DISCOVERY

This is a fundamental requirement.

Do NOT create:

public room search

public room list

trending rooms

room directory

random rooms

discoverable rooms

The only normal way into a room is through its valid invite/access code.

58. URL HANDLING

Optionally support a share link such as:

nexus.example/join/NXS-8K4-2P7

However, the link should still require proper server-side validation.

Do not expose private database IDs directly if avoidable.

59. QR CODE

Optional feature:

Allow the owner to generate a QR code containing the room join link.

Display:

SCAN TO JOIN

The QR code should be generated dynamically.

Include:

COPY CODE

as the primary fallback.

60. PERFORMANCE

The website should feel fast.

Avoid:

giant libraries for simple effects

unnecessary re-renders

excessive DOM elements

animations that consume excessive CPU

constantly running expensive effects

Optimize message rendering.

Use pagination or virtualization if a room becomes large.

61. CHAT HISTORY

Persist messages.

When joining an existing room:

Load recent messages.

Do not download thousands of messages unnecessarily.

Implement:

LOAD MORE

or infinite scrolling when appropriate.

62. MESSAGE ORDERING

Messages must remain correctly ordered even if multiple users send messages at nearly the same time.

Use server timestamps/IDs appropriately.

Do not rely solely on local browser time.

63. OFFLINE HANDLING

If the user loses connection:

Display:

CONNECTION LOST

Messages should not appear as successfully sent if the backend never received them.

If retry functionality is implemented, clearly indicate messages awaiting delivery.

64. ROOM LIFECYCLE

Handle:

room creation

joining

leaving

owner leaving

room deletion

inactive rooms

Define a sensible behavior for owner departure.

For example:

transfer ownership to another member

or close the room

Implement one approach consistently.

65. MODALS

Use custom animated modals for:

invite

settings

delete room

remove member

regenerate code

leave room

Modals should have:

backdrop blur

fade-in

scale-in

keyboard Escape support

click-outside behavior where appropriate

66. SIDEBAR

Desktop sidebar should contain:

NEXUS logo

Current room

Invite

Members

Settings

Leave

Optional status indicator.

Keep it compact and clean.

67. MEMBER LIST

Member cards:

Avatar

Display name

Status

Owner badge where applicable

Example:

CP

Colt

● Online

Owner:

OWNER

Use subtle animations when members appear/disappear.

68. OWNER BADGE

Do not use a giant colorful badge.

Use a subtle label:

OWNER

with a small icon.

69. CHAT DATE SEPARATORS

For longer conversations, separate messages by date.

Example:

TODAY

YESTERDAY

SEP 9, 2026

Use subtle typography.

70. TIME DISPLAY

Show:

6:42 PM

Optionally show exact timestamp on hover/tap.

Do not overwhelm every message with metadata.

71. MESSAGE BUBBLE DESIGN

Message bubbles should have:

moderate rounding

readable spacing

subtle border

subtle background

no excessive glow

Current user's bubbles:

Slight cyan/purple accent.

Other users:

Neutral dark glass.

Do not make every message neon.

72. AVATARS

Automatically generate avatar appearance from the user's name.

Possibilities:

initials

abstract geometric patterns

gradient ring

generated identicon

Keep avatars lightweight.

73. GROUP AVATAR

Generate a group avatar based on the room name.

Display it in:

chat header

invite screen

room cards if ever used

74. FIRST VISIT EXPERIENCE

On first visit:

Show landing page.

Do not immediately force login.

The goal is:

Open → Create/Join → Chat.

Keep friction low.

75. ERROR PAGE

Create a custom 404/error screen.

Example:

NEXUS SIGNAL LOST

The page you're looking for doesn't exist.

Button:

RETURN TO NEXUS

76. DISCONNECTED ROOM

If a room is deleted while someone is inside it:

Show a clear overlay:

ROOM CLOSED

This NEXUS room is no longer available.

Button:

RETURN HOME

Do not leave the user staring at a broken chat.

77. CODE GENERATION

Do not use predictable sequential IDs.

Bad:

ROOM-001

ROOM-002

Use secure randomness.

Example:

NXS-4K7-XP2

Consider collision checking on the server.

If a collision occurs, regenerate.

78. DATABASE SECURITY

If using Supabase:

Implement Row Level Security policies.

Users should only be able to:

access rooms they joined/authorized

read messages from authorized rooms

create valid messages

modify their own messages

perform owner operations if actually the owner

Do not use a wide-open database policy just to make the demo work.

79. ENVIRONMENT CONFIGURATION

Create a .env.example.

Document required variables.

Never commit actual credentials.

Example structure:

PUBLIC_BACKEND_URL=
PUBLIC_BACKEND_KEY=


Use the appropriate naming convention for the selected framework.

80. PROJECT STRUCTURE

Organize the code professionally.

Suggested:

src/
  components/
    Button
    Input
    Modal
    Toast
    Avatar
    MessageBubble
    MessageComposer
    MemberList
    InvitePanel

  pages/
    Home
    CreateRoom
    JoinRoom
    ChatRoom
    Error

  hooks/
    useRoom
    useMessages
    usePresence
    useTyping

  services/
    roomService
    messageService
    memberService

  lib/
    backend
    validation
    formatting

  styles/
    globals
    animations
    theme


Adapt this structure to the framework.

81. CODE QUALITY

Write maintainable production-style code.

Avoid:

massive components

duplicated logic

hardcoded room data

fake API calls

placeholder functions

unused imports

console spam

unnecessary dependencies

Use TypeScript types throughout if TypeScript is used.

82. COMPONENT DESIGN

Make reusable components.

Examples:

Button

GlassCard

TextInput

Toast

Modal

Avatar

MessageBubble

RoomHeader

MemberList

InviteCode

LoadingScreen

83. DESIGN SYSTEM

Create reusable design tokens.

Examples:

--background
--surface
--surface-hover
--border
--text
--text-muted
--primary
--secondary
--danger
--success
--radius
--shadow


Use consistent spacing.

Do not randomly choose different border radii throughout the application.

84. ANIMATION SYSTEM

Create reusable animation classes/components.

Examples:

fadeIn

slideUp

slideLeft

slideRight

scaleIn

glowPulse

shimmer

pageTransition

Do not manually duplicate animation CSS everywhere.

85. REDUCED MOTION

Detect:

prefers-reduced-motion: reduce

When enabled:

disable particles

reduce transitions

remove large movement

retain essential state changes

86. CURSOR INTERACTIONS

Desktop only:

Some major cards can subtly respond to mouse movement.

Example:

The invite card slightly follows the cursor.

Keep it extremely subtle.

Do not make the interface feel gimmicky.

87. PARTICLES

Use a lightweight particle system.

Particles should:

move slowly

have low opacity

avoid blocking text

not consume excessive CPU

Connection lines can occasionally appear between nearby particles.

88. GRID

Optional subtle background grid.

The grid should be barely visible.

Animate it very slowly.

The grid should never make text difficult to read.

89. SYSTEM STATUS

Add subtle technical status information.

Example:

NXS // SECURE CHANNEL

NODE STATUS: ONLINE

REALTIME: ACTIVE

These are visual elements only unless the underlying status is actually known.

Do not display fake security claims.

90. PAGE TITLE

Use appropriate browser titles.

Examples:

Landing:

NEXUS — Private Group Chat

Create:

Create Room — NEXUS

Join:

Join Room — NEXUS

Chat:

Weekend Crew — NEXUS

91. FAVICON

Create a simple N/X style favicon.

Use the same visual identity as the main logo.

92. RESPONSIVE TESTING

Before considering the project finished, test:

Chrome

Edge

Firefox if available

desktop

mobile viewport

tablet viewport

Test:

create room

copy code

join room

send message

receive message

refresh

leave

reconnect

invalid code

deleted room

owner controls

93. TWO-BROWSER TEST

This is extremely important.

Open the application in:

Browser Window A

and:

Browser Window B

Create a room in A.

Join the room in B.

Send:

Hello

from A.

It must appear in B.

Send:

Hello back

from B.

It must appear in A.

Test typing indicators.

Test online status.

Test member joining.

94. NO FAKE DATA

Do not populate the production interface with fake conversations like:

Hey everyone!

What's up?

unless they are explicitly part of a first-run demo.

The actual chat should start empty.

95. NO PLACEHOLDER BUTTONS

Every visible button must either:

work,

open the correct interface,

or be intentionally disabled with an explanation.

Do not create buttons that do nothing.

96. POLISHED EMPTY STATES

Create empty states for:

no messages

no members besides yourself

no search results if search is later added

connection unavailable

loading room

Each should feel intentionally designed.

97. FINAL VISUAL GOAL

The finished website should feel like someone spent serious time designing it.

Imagine opening the page and seeing:

A black futuristic environment.

Subtle moving particles.

A glowing NEXUS logo.

Elegant typography.

Glass panels.

Neon cyan/violet accents.

Smooth transitions.

Then creating a room and receiving a beautiful animated invite code.

Then entering a real-time chat where messages slide into the conversation smoothly.

Everything should feel connected.

Nothing should feel like a default component library.

98. IMPORTANT BUILD RULE

Do not stop after creating the landing page.

Build the entire application.

Do not return a mockup.

Do not use fake backend data.

Do not make the chat frontend-only.

Do not leave TODO comments for core functionality.

Do not say that real-time messaging needs to be implemented later.

Implement the complete core functionality now.

99. FINAL ACCEPTANCE TEST

The application is only considered complete when this workflow works:

TEST 1

Open NEXUS.

Landing page loads with animations.

TEST 2

Click CREATE CHAT.

Enter:

Name: Alex

Group:

Weekend Crew

Create room.

TEST 3

Receive a unique code:

NXS-XXXX-XXX

Copy it.

TEST 4

Open another browser/device.

Click JOIN CHAT.

Enter:

Jordan

Enter the code.

Successfully enter the same room.

TEST 5

Alex sends a message.

Jordan sees it in real time.

TEST 6

Jordan sends a message.

Alex sees it in real time.

TEST 7

Jordan starts typing.

Alex sees:

Jordan is typing...

TEST 8

Jordan leaves.

Alex sees Jordan go offline/leave.

TEST 9

Owner regenerates the invite code.

Old code no longer works.

New code works.

TEST 10

Owner deletes the room.

All connected clients receive:

ROOM CLOSED

and are returned safely to the home screen.

100. FINAL INSTRUCTION TO THE CODING AGENT

Build NEXUS as a complete, polished, real-time private group messaging application.

Prioritize:

REAL functionality

Security

Real-time synchronization

Beautiful UI

Smooth animations

Responsive design

Accessibility

Performance

Clean architecture

Professional finishing touches

The application should feel like a real product, not an AI-generated template.

Use thoughtful UX decisions where details are unspecified, but never sacrifice the core requirement:

People create private group chats, receive a unique access code, and only people with that code can join.

Make every screen, transition, button, modal, input, message, notification, and loading state feel like part of the same premium NEXUS design system.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/f8d00419-b580-43d4-aeeb-e8006ecc6360).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
