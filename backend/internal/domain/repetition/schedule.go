package repetition

import "time"

type ReviewResult string

const (
	Know     ReviewResult = "know"
	Unsure   ReviewResult = "unsure"
	DontKnow ReviewResult = "dont_know"
)

type Interval struct {
	Label    string
	Duration time.Duration
}

var Intervals = []Interval{
	{Label: "2 минуты", Duration: 2 * time.Minute},
	{Label: "10 минут", Duration: 10 * time.Minute},
	{Label: "1 час", Duration: time.Hour},
	{Label: "6 часов", Duration: 6 * time.Hour},
	{Label: "следующий день", Duration: 24 * time.Hour},
	{Label: "3 дня", Duration: 3 * 24 * time.Hour},
	{Label: "7 дней", Duration: 7 * 24 * time.Hour},
	{Label: "14 дней", Duration: 14 * 24 * time.Hour},
	{Label: "30 дней", Duration: 30 * 24 * time.Hour},
}

func ApplyResult(currentLevel int, result ReviewResult) int {
	switch result {
	case Know:
		return ClampLevel(currentLevel + 1)
	case Unsure:
		return ClampLevel(currentLevel - 1)
	default:
		return 0
	}
}

func ClampLevel(level int) int {
	if level < 0 {
		return 0
	}
	maxLevel := len(Intervals) - 1
	if level > maxLevel {
		return maxLevel
	}
	return level
}

func NextReviewAt(level int, from time.Time) time.Time {
	return from.Add(Intervals[ClampLevel(level)].Duration)
}

func LevelLabel(level int) string {
	return Intervals[ClampLevel(level)].Label
}
