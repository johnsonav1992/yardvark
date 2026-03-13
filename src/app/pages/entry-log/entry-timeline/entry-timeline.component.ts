import { DatePipe } from "@angular/common";
import {
	afterNextRender,
	Component,
	computed,
	effect,
	type ElementRef,
	inject,
	type OnDestroy,
	signal,
	viewChild,
} from "@angular/core";
import { Router } from "@angular/router";
import {
	differenceInMonths,
	eachWeekOfInterval,
	endOfMonth,
	endOfWeek,
	format,
	isWithinInterval,
	parseISO,
	startOfMonth,
	subMonths,
} from "date-fns";
import { ProgressSpinnerModule } from "primeng/progressspinner";
import { SkeletonModule } from "primeng/skeleton";
import { EntriesService } from "../../../services/entries.service";
import { GlobalUiService } from "../../../services/global-ui.service";
import type { Entry } from "../../../types/entries.types";
import { getActivityIcon } from "../../../utils/entriesUtils";

type TimelineWeek = {
	weekStart: Date;
	entries: Entry[];
	isCurrentWeek: boolean;
	monthLabel: string | null;
};

@Component({
	selector: "entry-timeline",
	imports: [DatePipe, ProgressSpinnerModule, SkeletonModule],
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
	private _intersectionObserver: IntersectionObserver | null = null;
	private _sentinelElement: HTMLElement | null = null;
	private _expansionInProgress = false;

	public isMobile = this._globalUiService.isMobile;
	public isDarkMode = this._globalUiService.isDarkMode;

	private readonly _rangeEnd = signal(endOfMonth(new Date()));
	public rangeStart = signal(subMonths(startOfMonth(new Date()), 1));

	private readonly _maxMonthsBack = 24;
	private readonly _latestEntries = signal<Entry[] | undefined>(undefined);

	public readonly skeletonColumns = Array.from({ length: 8 }, (_, i) => i);
	public readonly showSkeleton = computed(() => this._latestEntries() === undefined);

	public timelineEntries = this._entriesService.getTimelineEntriesResource(
		this.rangeStart,
		this._rangeEnd,
	);

	public weeks = computed<TimelineWeek[]>(() => {
		const entries = this._latestEntries() ?? [];
		const weekStarts = eachWeekOfInterval(
			{ start: this.rangeStart(), end: new Date() },
			{ weekStartsOn: 0 },
		);
		const reversed = [...weekStarts].reverse();

		return reversed.map((weekStart, index) => {
			const weekEnd = endOfWeek(weekStart, { weekStartsOn: 0 });
			const weekEntries = entries.filter((e) => {
				const d = parseISO(e.date.toString());

				return isWithinInterval(d, { start: weekStart, end: weekEnd });
			});

			const now = new Date();
			const isCurrentWeek = now >= weekStart && now <= weekEnd;
			const isNewMonth =
				index > 0 &&
				weekStart.getMonth() !== reversed[index - 1].getMonth();
			const monthLabel = isNewMonth ? format(weekStart, "MMMM yyyy") : null;

			return { weekStart, entries: weekEntries, isCurrentWeek, monthLabel };
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
				this._expansionInProgress = false;
				this._reobserveSentinel();
			}
		});

		afterNextRender(() => {
			this._setupIntersectionObserver();
		});
	}

	public ngOnDestroy(): void {
		this._intersectionObserver?.disconnect();
	}

	public navigateToEntry(entry: Entry): void {
		this._router.navigate(["entry-log", entry.id], {
			queryParams: { date: new Date(entry.date).toISOString() },
		});
	}

	public getActivityIcon(activityName: string): string {
		return getActivityIcon(activityName);
	}

	private _reobserveSentinel(): void {
		if (this._intersectionObserver && this._sentinelElement) {
			this._intersectionObserver.unobserve(this._sentinelElement);
			this._intersectionObserver.observe(this._sentinelElement);
		}
	}

	private _setupIntersectionObserver(): void {
		const sentinel = this._loadSentinel()?.nativeElement;
		const container = this._scrollContainer()?.nativeElement;

		if (!sentinel || !container) return;

		this._sentinelElement = sentinel;

		this._intersectionObserver = new IntersectionObserver(
			(entries) => {
				if (
					entries[0].isIntersecting &&
					!this.timelineEntries.isLoading() &&
					!this.showSkeleton() &&
					!this._expansionInProgress
				) {
					this._expansionInProgress = true;
					this._loadMoreHistory();
				}
			},
			{ root: container, threshold: 0.01 },
		);

		this._intersectionObserver.observe(sentinel);
	}

	private _loadMoreHistory(): void {
		const newStart = subMonths(this.rangeStart(), 1);
		const monthsBack = differenceInMonths(new Date(), newStart);

		if (monthsBack <= this._maxMonthsBack) {
			this.rangeStart.set(newStart);
		}
	}
}
