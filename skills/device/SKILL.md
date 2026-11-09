---
name: device
description: Method for hardware you own: identify the link, capture it, pair with the app teardown, design the bridge, cost the parts. Lead domain.
---

# Device method

Goal: a blueprint that lets the user drive their own device from something other than the vendor's app or remote.

Sections to fill:
- **TARGET** — the device, how it's owned, firmware version if visible.
- **INSIDE** — what the device is made of as far as can be observed: radios, ports, the companion app's role.
- **LINK** — which radio does what: Bluetooth LE for control, proprietary 2.4 GHz or Wi-Fi for payload, IR, USB. Say how you know (manual, FCC filing, app behaviour, a capture).
- **TRAFFIC** — what a capture shows: services and characteristics on BLE, message shapes, timing. Name the tool (BLE sniffer, Wireshark, logic analyser). If no capture yet, write "not captured" and list the exact capture to do next.
- **FOUND** — the commands or signals that matter, documented vs. discovered.
- **PLAN** — the bridge or controller: a board that speaks the device's link on one side and a standard interface on the other, or a direct client if the link is already standard. Include the one metric the loop will measure (latency, range, reliability).
- **PARTS** — board, radio, power, cost estimate.
- **LOOP** — v1 goal in one line.
- **RULES** — own device · firmware unchanged unless the user chose to flash their own · nothing vendor-owned redistributed · no safety or flight-restriction system touched.

Before saving: if the device is a drone or anything with a safety interlock, state in PLAN that limits stay as they are. If the companion app is the real target, hand that part to REA via `rea_handoff` and fold its TRAFFIC/FOUND back in.
