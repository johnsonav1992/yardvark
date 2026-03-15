import { DatePipe } from "@angular/common";
import {
	afterNextRender,
	Component,
	computed,
	effect,
	inject,
	signal,
	viewChild,
	type ElementRef,
	type OnDestroy,
} from "@angular/core";
import { Router } from "@angular/router";
import {
	differenceInMonths,
	eachWeekOfInterval,
	endOfMonth,
	endOfWeek,
	format,
	isValid,
	isWithinInterval,
	parseISO,
	startOfMonth,
	subMonths,
} from "date-fns";
import { ButtonModule } from "primeng/button";
import { type Popover, PopoverModule } from "primeng/popover";
import { SkeletonModule } from "primeng/skeleton";
import { PageContainerComponent } from "../../../components/layout/page-container/page-container.component";
import { EntriesService } from "../../../services/entries.service";
import { GlobalUiService } from "../../../services/global-ui.service";
import type { Entry } from "../../../types/entries.types";
import { getActivityIcon } from "../../../utils/entriesUtils";

type TimelineActivity = Entry["activities"][number] & { icon: string };

type TimelineEntry = Omit<Entry, "activities"> & {
	activities: TimelineActivity[];
	primaryActivityIcon: string;
};

type TimelineWeek = {
	weekStart: Date;
	mowingEntries: TimelineEntry[];
	otherEntries: TimelineEntry[];
	isCurrentWeek: boolean;
	monthLabel: string | null;
};

@Component({
	selector: "entry-timeline",
	imports: [
		ButtonModule,
		DatePipe,
		PageContainerComponent,
		PopoverModule,
		SkeletonModule,
	],
	templateUrl: "./entry-timeline.component.html",
	styleUrl: "./entry-timeline.component.scss",
})
export class EntryTimelineComponent implements OnDestroy {
	private _entriesService = inject(EntriesService);
	private _globalUiService = inject(GlobalUiService);
	private _router = inject(Router);

	private _scrollContainer =
		viewChild<ElementRef<HTMLElement>>("scrollContainer");
	private _loadSentinel = viewChild<ElementRef<HTMLElement>>("loadSentinel");
	private _overflowPopover = viewChild<Popover>("overflowPopover");
	private _entryPreviewPopover = viewChild<Popover>("entryPreviewPopover");
	private readonly _intersectionObserver = signal<IntersectionObserver | null>(
		null,
	);
	private readonly _sentinelElement = signal<HTMLElement | null>(null);
	private readonly _expansionInProgress = signal(false);

	public isMobile = this._globalUiService.isMobile;
	public isDarkMode = this._globalUiService.isDarkMode;

	private readonly _rangeEnd = signal(endOfMonth(new Date()));
	public rangeStart = signal(subMonths(startOfMonth(new Date()), 1));

	private readonly _maxMonthsBack = 24;
	private readonly _latestEntries = signal<Entry[] | undefined>(undefined);

	public readonly skeletonColumns = Array.from({ length: 16 }, (_, i) => i);
	public readonly showSkeleton = computed(
		() => this._latestEntries() === undefined,
	);
	public readonly overflowEntries = signal<TimelineEntry[]>([]);
	public readonly selectedEntry = signal<TimelineEntry | null>(null);

	public timelineEntries = this._entriesService.getTimelineEntriesResource(
		this.rangeStart,
		this._rangeEnd,
	);

	public weeks = computed<TimelineWeek[]>(() => {
		const allEntries = this._latestEntries() ?? [];
		const weekStarts = eachWeekOfInterval(
			{ start: this.rangeStart(), end: new Date() },
			{ weekStartsOn: 0 },
		);
		const reversed = [...weekStarts].reverse();

		const toTimelineEntry = (e: Entry): TimelineEntry => ({
			...e,
			activities: e.activities.map((a) => ({
				...a,
				icon: getActivityIcon(a.name),
			})),
			primaryActivityIcon: getActivityIcon(e.activities[0]?.name ?? ""),
		});

		return reversed.map((weekStart, index) => {
			const weekEnd = endOfWeek(weekStart, { weekStartsOn: 0 });
			const weekEntries = allEntries
				.filter((e) => {
					const d = parseISO(e.date.toString());

					return isWithinInterval(d, { start: weekStart, end: weekEnd });
				})
				.map(toTimelineEntry);

			const now = new Date();
			const isCurrentWeek = now >= weekStart && now <= weekEnd;
			const isNewMonth =
				index > 0 && weekStart.getMonth() !== reversed[index - 1].getMonth();
			const monthLabel = isNewMonth ? format(weekStart, "MMMM yyyy") : null;
			const mowingEntries = weekEntries.filter((e) =>
				e.activities.some((a) => a.name === "mow"),
			);
			const otherEntries = weekEntries.filter(
				(e) => !e.activities.some((a) => a.name === "mow"),
			);

			return {
				weekStart,
				mowingEntries,
				otherEntries,
				isCurrentWeek,
				monthLabel,
			};
		});
	});

	public hasAnyEntries = computed(
		() => (this._latestEntries()?.length ?? 0) > 0,
	);

	constructor() {
		effect(() => {
			const v = this.timelineEntries.value();

			if (v !== undefined) {
				this._latestEntries.set(v);
			}

			if (!this.timelineEntries.isLoading()) {
				this._expansionInProgress.set(false);
				this._reobserveSentinel();
			}
		});

		afterNextRender(() => {
			this._setupIntersectionObserver();
		});
	}

	public ngOnDestroy(): void {
		this._intersectionObserver()?.disconnect();
	}

	public readonly selectedEntryTime = computed(() => {
		const entry = this.selectedEntry();

		if (!entry?.time) return null;

		const datePart = format(parseISO(entry.date.toString()), "yyyy-MM-dd");
		const dt = parseISO(`${datePart}T${entry.time}`);

		return isValid(dt) ? format(dt, "h:mm a") : null;
	});

	public navigateToEntry(entry: TimelineEntry): void {
		this._router.navigate(["entry-log", entry.id], {
			queryParams: { date: new Date(entry.date).toISOString() },
		});
	}

	public showEntryPreview(event: MouseEvent, entry: TimelineEntry): void {
		this.selectedEntry.set(entry);
		this._entryPreviewPopover()?.toggle(event);
	}

	public showOverflow(event: MouseEvent, entries: TimelineEntry[]): void {
		this.overflowEntries.set(entries);
		this._overflowPopover()?.toggle(event);
	}

	public showEntryPreviewFromOverflow(
		event: MouseEvent,
		entry: TimelineEntry,
	): void {
		this.showEntryPreview(event, entry);
	}

	private _reobserveSentinel(): void {
		const observer = this._intersectionObserver();
		const sentinel = this._sentinelElement();

		if (observer && sentinel) {
			observer.unobserve(sentinel);
			observer.observe(sentinel);
		}
	}

	private _setupIntersectionObserver(): void {
		const sentinel = this._loadSentinel()?.nativeElement;
		const container = this._scrollContainer()?.nativeElement;

		if (!sentinel || !container) return;

		this._sentinelElement.set(sentinel);

		const observer = new IntersectionObserver(
			(entries) => {
				if (
					entries[0].isIntersecting &&
					!this.timelineEntries.isLoading() &&
					!this.showSkeleton() &&
					!this._expansionInProgress()
				) {
					this._expansionInProgress.set(true);
					this._loadMoreHistory();
				}
			},
			{ root: this.isMobile() ? null : container, threshold: 0.01 },
		);

		this._intersectionObserver.set(observer);
		observer.observe(sentinel);
	}

	private _loadMoreHistory(): void {
		const newStart = subMonths(this.rangeStart(), 1);
		const monthsBack = differenceInMonths(new Date(), newStart);

		if (monthsBack <= this._maxMonthsBack) {
			this.rangeStart.set(newStart);
		}
	}
}
