# Campus Stores PRO • Media Equipment Desk

A transformed, production-grade media equipment desk operations and checkout system built with **Motion.dev for React**, featuring an elevated design system inspired by Linear, Raycast, and Vercel.

---

## 🚀 Quick Start

### Option 1: Direct Local Server (Zero Build Step)
The app is engineered to run offline or online with zero build steps required. Simply serve over HTTP:

```bash
# Using Python
python -m http.server 8000 --bind 127.0.0.1
# Or py:
py -m http.server 8000 --bind 127.0.0.1
```
Visit [`http://localhost:8000`](http://localhost:8000).

### Option 2: Modern Vite + React + Motion.dev Toolchain
For developers building within the standard React ecosystem:

```bash
npm install
npm run dev
```

---

## 💡 Product Engineer Practical — Critique & Redesign

### 1. What the baseline product handled well
- **Rigid Data Validation**: The baseline desk logic strictly validated equipment requests against approved requisition forms. Attendants could not issue unapproved hardware models or issue units currently in repair or already out on loan.

### 2. The critical friction point identified
- **The Kit Issuance & Return Bottleneck**:
  At a busy student activities counter, clubs rarely borrow individual items in isolation—they requisition **complete kits** (e.g. Film Society's screening kit: Projector + Speaker + USB-C adapter).
  In the baseline application:
  1. The desk attendant had to switch back and forth between "Requests" and "Loan Register" to remember what was approved.
  2. Issuing the kit required filling **three separate, repetitive manual issue slips** (4 dropdown selections each) one-by-one.
  3. When equipment was returned in pieces (e.g. Kabir bringing back the projector and speaker on Friday night, but Leela keeping the adapter until Saturday morning), there was no unified status showing which kit items were still outstanding for that event requisition.

### 3. The Redesigned Solution
- **Intelligent Kit Fulfillment Assistant**:
  When viewing any approved request, the workstation automatically scans shelf stock, filters out items marked for repair, and presents an interactive fulfillment matrix. The attendant can issue verified shelf units in one click per item with authorized collector and due times pre-populated.
- **Cross-Linked Shelf & Loan Visibility**:
  Attendants can see rack locations (`Bin A2`, `Bin B1`, `Bin C4`), active loan holders, and repair ticket alerts directly from the inventory list and register slips.
- **Motion.dev Interactions & Micro-animations**:
  - Smooth page transitions with `AnimatePresence`.
  - Spring-physics card entrances and list item interactions.
  - Interactive shift timeline stepper with live phase objective callouts.
  - Non-intrusive floating toast notifications for every counter action.
- **Keyboard Productivity**:
  Press `1` for Requests, `2` for Inventory, `3` for Loan Register, `4` for Desk Book; `Esc` to dismiss dialogs.

---

## 🎨 Design System Specifications
- **Typography**: Inter & JetBrains Mono with tight letter spacing and tabular numerals.
- **Theme Support**: Seamless Dark (Obsidian Glass) and Light (Crisp Paper) mode toggling.
- **Motion**: Powered by Matt Perry's Motion.dev spring transitions (`stiffness: 350, damping: 28`).
- **Icons**: Pixel-perfect Lucide-compatible vector icons.
- **Local Storage Persistence**: Full shift state persistence in browser storage (`campus-stores.shift.v1`).
