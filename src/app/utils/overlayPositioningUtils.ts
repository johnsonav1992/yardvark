export function fixOverlayPositionForScroll(
	getOverlayElement: () => HTMLElement | undefined | null,
): void {
	// AVJ: we have to do this dumb hack because primeng
	// is dumb and calculates positions of overlays wrong
	// when they are connected to fixed things on the page
	// and the page is scrolled...
	setTimeout(() => {
		const overlayElement = getOverlayElement();
		if (!overlayElement) return;

		const currentTop = parseFloat(overlayElement.style.top);
		const scrollOffset = window.scrollY || document.documentElement.scrollTop;
		overlayElement.style.top = `${currentTop - scrollOffset}px`;
	}, 0);
}
