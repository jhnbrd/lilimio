# iOS viewport containment

The viewport now requests device width, initial scale 1, minimum scale 1 and viewport-fit=cover. No maximum scale or user-scalable=no is set, so text enlargement remains possible. Root/body/app canvas dimensions and background cover the dynamic viewport, horizontal paint overflow is clipped, and overscroll-behavior contains boundary bounce. Safe-area padding protects controls around the notch in fullscreen/landscape.

This does not install gesture/touch handlers that cancel all pinches, interfere with maps, suppress accessibility zoom. WebKit controls the visual viewport and can still provide elastic gestures or ignore viewport zoom hints in some modes/versions. Actual installed iPhone testing is required to verify the user's exact pinch-out case. Test a short page, a scrolling guide, landscape, keyboard-open state, pinch-enlarge and return-to-baseline.

The production service worker must activate the new build before these changes are visible; accept the app's Update now prompt and reopen if required.

References: https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/UsingtheViewport/UsingtheViewport.html and https://webkit.org/blog/7367/new-interaction-behaviors-in-ios-10/ .

## App frame refinement

The document is now a fixed dynamic-viewport canvas. Main content owns vertical scrolling with overflow:auto and min-height:0; the header and bottom navigation stay outside that scroller. Short content has no scroll range. Long content, smaller viewports and enlarged text retain scrolling. Decorative art is positioned behind content and adds no artificial bottom padding. Onboarding and dialogs own their local overflow. Route changes reset main scroll; browser back restores the previous position.

Browser checks: 390x844 Today, More and Explore map each main 665:665 (client:scroll height); root 844:844. Settings at 390x844 main 768:768; at 390x667 main 591:683. At 200% text Settings main 515:949 and root 667:667, with no horizontal document overflow. Physical installed iOS gesture and keyboard checks remain required.
