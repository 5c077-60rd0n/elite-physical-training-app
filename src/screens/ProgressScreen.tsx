import { PageWrapper } from '../components/layout/PageWrapper';
import { useMemo, useState } from 'react';
import { SimpleTrendChart } from '../components/charts/SimpleTrendChart';
import { getAverageRpe, getBodyMetricTrend, getCompletionRate, getMovingAveragePoints } from '../lib/analytics';
import { todayIso } from '../lib/date';
import { getLatestBodyMetric } from '../lib/program';
import type { BodyMetricEntry, DayPlan, PhotoCheckIn, PhotoCheckInView, ProgressMap } from '../types';

interface ProgressScreenProps {
  plan: DayPlan[];
  progress: ProgressMap;
  bodyMetrics: BodyMetricEntry[];
  onSaveMetric: (entry: BodyMetricEntry, previousDate?: string) => void;
  onDeleteMetric: (date: string) => void;
  photoCheckIns: PhotoCheckIn[];
  onSavePhotoCheckIn: (entry: PhotoCheckIn) => void;
  onUpdatePhotoCheckIn: (key: string, entry: PhotoCheckIn) => void;
  onDeletePhotoCheckIn: (key: string) => void;
}

function photoKey(entry: PhotoCheckIn) {
  return `${entry.date}-${entry.imageDataUrl.slice(0, 32)}`;
}

export function ProgressScreen({ plan, progress, bodyMetrics, onSaveMetric, onDeleteMetric, photoCheckIns, onSavePhotoCheckIn, onUpdatePhotoCheckIn, onDeletePhotoCheckIn }: ProgressScreenProps) {
  const completion = getCompletionRate(plan, progress);
  const averageRpe = getAverageRpe(progress, plan);
  const completedDays = plan.filter((day) => progress[day.dateIso]?.sessionComplete);
  const latestMetric = getLatestBodyMetric(bodyMetrics);
  const trend = getBodyMetricTrend(bodyMetrics);
  const [metricDate, setMetricDate] = useState(todayIso());
  const [weightLbs, setWeightLbs] = useState(latestMetric?.weightLbs ? String(latestMetric.weightLbs) : '');
  const [waistInches, setWaistInches] = useState(latestMetric?.waistInches ? String(latestMetric.waistInches) : '');
  const [note, setNote] = useState('');
  const [editingMetricDate, setEditingMetricDate] = useState<string | null>(null);
  const [photoDate, setPhotoDate] = useState(todayIso());
  const [photoNote, setPhotoNote] = useState('');
  const [photoView, setPhotoView] = useState<PhotoCheckInView>('front');
  const [editingPhotoKey, setEditingPhotoKey] = useState<string | null>(null);
  const [editingPhotoDataUrl, setEditingPhotoDataUrl] = useState<string | null>(null);

  const sortedMetrics = useMemo(
    () => [...bodyMetrics].sort((left, right) => right.date.localeCompare(left.date)).slice(0, 6),
    [bodyMetrics],
  );
  const sortedPhotos = useMemo(
    () => [...photoCheckIns].sort((left, right) => right.date.localeCompare(left.date)).slice(0, 6),
    [photoCheckIns],
  );
  const weightPoints = useMemo(
    () => [...bodyMetrics].sort((left, right) => left.date.localeCompare(right.date)).slice(-6).map((entry) => ({ label: entry.date.slice(5), value: entry.weightLbs })),
    [bodyMetrics],
  );
  const waistPoints = useMemo(
    () => [...bodyMetrics].sort((left, right) => left.date.localeCompare(right.date)).slice(-6).map((entry) => ({ label: entry.date.slice(5), value: entry.waistInches })),
    [bodyMetrics],
  );
  const weightMovingAveragePoints = useMemo(
    () => getMovingAveragePoints(bodyMetrics, 'weightLbs').slice(-6),
    [bodyMetrics],
  );
  const waistMovingAveragePoints = useMemo(
    () => getMovingAveragePoints(bodyMetrics, 'waistInches').slice(-6),
    [bodyMetrics],
  );
  const adherencePoints = useMemo(
    () => plan.map((day) => ({ label: day.dayName.slice(0, 3), value: progress[day.dateIso]?.sessionComplete ? 100 : 0 })),
    [plan, progress],
  );
  const rpePoints = useMemo(
    () => plan.filter((day) => progress[day.dateIso]).map((day) => ({ label: day.dayName.slice(0, 3), value: progress[day.dateIso].rpe })),
    [plan, progress],
  );

  function saveMetric() {
    const parsedWeight = Number(weightLbs);
    const parsedWaist = Number(waistInches);

    if (!Number.isFinite(parsedWeight) || !Number.isFinite(parsedWaist)) {
      return;
    }

    onSaveMetric({
      date: metricDate,
      weightLbs: parsedWeight,
      waistInches: parsedWaist,
      note,
    }, editingMetricDate ?? undefined);
    setNote('');
    setEditingMetricDate(null);
  }

  function startMetricEdit(entry: BodyMetricEntry) {
    setEditingMetricDate(entry.date);
    setMetricDate(entry.date);
    setWeightLbs(String(entry.weightLbs));
    setWaistInches(String(entry.waistInches));
    setNote(entry.note);
  }

  function cancelMetricEdit() {
    setEditingMetricDate(null);
    setMetricDate(todayIso());
    setWeightLbs(latestMetric?.weightLbs ? String(latestMetric.weightLbs) : '');
    setWaistInches(latestMetric?.waistInches ? String(latestMetric.waistInches) : '');
    setNote('');
  }

  function handlePhotoSelection(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const imageDataUrl = typeof reader.result === 'string' ? reader.result : '';
      if (!imageDataUrl) {
        return;
      }

      onSavePhotoCheckIn({
        date: photoDate,
        imageDataUrl,
        note: photoNote,
        view: photoView,
      });
      setPhotoNote('');
      setPhotoView('front');
      event.target.value = '';
    };
    reader.readAsDataURL(file);
  }

  function startPhotoEdit(entry: PhotoCheckIn) {
    setEditingPhotoKey(photoKey(entry));
    setEditingPhotoDataUrl(entry.imageDataUrl);
    setPhotoDate(entry.date);
    setPhotoNote(entry.note);
    setPhotoView(entry.view ?? 'other');
  }

  function savePhotoEdit() {
    if (!editingPhotoKey || !editingPhotoDataUrl) {
      return;
    }

    onUpdatePhotoCheckIn(editingPhotoKey, {
      date: photoDate,
      imageDataUrl: editingPhotoDataUrl,
      note: photoNote,
      view: photoView,
    });
    setEditingPhotoKey(null);
    setEditingPhotoDataUrl(null);
    setPhotoDate(todayIso());
    setPhotoNote('');
    setPhotoView('front');
  }

  function cancelPhotoEdit() {
    setEditingPhotoKey(null);
    setEditingPhotoDataUrl(null);
    setPhotoDate(todayIso());
    setPhotoNote('');
    setPhotoView('front');
  }

  function confirmDeleteMetric(date: string) {
    if (!window.confirm(`Delete body metric entry for ${date}?`)) {
      return;
    }

    onDeleteMetric(date);
  }

  function confirmDeletePhoto(key: string, view: PhotoCheckInView | undefined, date: string) {
    if (!window.confirm(`Delete ${view ?? 'photo'} check-in from ${date}?`)) {
      return;
    }

    onDeletePhotoCheckIn(key);
  }

  return (
    <PageWrapper
      title="Progress"
      eyebrow="Progress"
      description="Track adherence, perceived effort, and body-composition trends over the current week."
    >
      <section className="summary-strip three-col">
        <article className="summary-box">
          <span className="card-kicker">Completed</span>
          <strong>{completion.completed}/{completion.total}</strong>
        </article>
        <article className="summary-box">
          <span className="card-kicker">Adherence</span>
          <strong>{completion.percent}%</strong>
        </article>
        <article className="summary-box">
          <span className="card-kicker">Average RPE</span>
          <strong>{averageRpe || '0.0'}</strong>
        </article>
      </section>

      <section className="summary-strip three-col">
        <article className="summary-box">
          <span className="card-kicker">Latest weight</span>
          <strong>{latestMetric ? `${latestMetric.weightLbs} lb` : 'Not logged'}</strong>
        </article>
        <article className="summary-box">
          <span className="card-kicker">Latest waist</span>
          <strong>{latestMetric ? `${latestMetric.waistInches} in` : 'Not logged'}</strong>
        </article>
        <article className="summary-box">
          <span className="card-kicker">Trend</span>
          <strong>{trend ? `${trend.weightDelta} lb · ${trend.waistDelta} in` : 'Need 2 entries'}</strong>
        </article>
      </section>

      <section className="summary-strip three-col">
        <article className="summary-box">
          <span className="card-kicker">Weight average</span>
          <strong>{weightMovingAveragePoints.length ? `${weightMovingAveragePoints[weightMovingAveragePoints.length - 1].value} lb` : 'Need 3 entries'}</strong>
        </article>
        <article className="summary-box">
          <span className="card-kicker">Waist average</span>
          <strong>{waistMovingAveragePoints.length ? `${waistMovingAveragePoints[waistMovingAveragePoints.length - 1].value} in` : 'Need 3 entries'}</strong>
        </article>
        <article className="summary-box">
          <span className="card-kicker">Interpretation</span>
          <strong>{trend ? 'Compare averages before reacting to a single weigh-in.' : 'Start with two to three consistent check-ins.'}</strong>
        </article>
      </section>

      <section className="content-stack second-row">
        <section className="panel">
          <header className="section-header">
            <div>
              <span className="panel-kicker">Session log</span>
              <h2 className="section-title">Completed entries</h2>
            </div>
          </header>
          <div className="exercise-list">
            {completedDays.length ? completedDays.map((day) => (
              <article className="exercise-card" key={day.dateIso}>
                <span className="card-kicker">{day.dayName}</span>
                <h3 className="exercise-name">{day.sessionLabel}</h3>
                <p className="exercise-note">RPE {progress[day.dateIso].rpe} · {progress[day.dateIso].notes || 'No note logged.'}</p>
              </article>
            )) : <article className="exercise-card"><h3 className="exercise-name">No completed sessions yet</h3><p className="exercise-note">Use the Today screen to log the first session of the week.</p></article>}
          </div>
        </section>

        <section className="tracker-panel">
          <header className="tracker-header">
            <div>
              <span className="panel-kicker">Interpretation</span>
              <h2 className="tracker-title">What to watch</h2>
            </div>
          </header>
          <ul className="detail-list">
            <li>The best fat-loss weeks usually keep performance stable while adherence stays high.</li>
            <li>High RPE without better reps often signals fatigue rather than progress.</li>
            <li>Missing recovery blocks repeatedly usually shows up first on lower-body days.</li>
            <li>Zone 2 compliance supports Sunday interval quality more than adding random extra intensity.</li>
          </ul>
        </section>
      </section>

      <section className="content-stack second-row">
        <section className="panel">
          <header className="section-header">
            <div>
              <span className="panel-kicker">Trend charts</span>
              <h2 className="section-title">Weekly visual signals</h2>
            </div>
          </header>
          <div className="chart-grid">
            <SimpleTrendChart title="Weight" points={weightPoints} colorClass="cyan" unit=" lb" />
            <SimpleTrendChart title="Weight moving average" points={weightMovingAveragePoints} colorClass="cyan" unit=" lb" />
            <SimpleTrendChart title="Waist" points={waistPoints} colorClass="gold" unit=" in" />
            <SimpleTrendChart title="Waist moving average" points={waistMovingAveragePoints} colorClass="gold" unit=" in" />
            <SimpleTrendChart title="Adherence" points={adherencePoints} colorClass="cyan" unit="%" />
            <SimpleTrendChart title="RPE" points={rpePoints} colorClass="gold" />
          </div>
        </section>

        <section className="tracker-panel">
          <header className="tracker-header">
            <div>
              <span className="panel-kicker">Photo check-ins</span>
              <h2 className="tracker-title">Visual consistency</h2>
            </div>
          </header>
          <div className="form-stack">
            <label className="field-label" htmlFor="photo-date">Photo date</label>
            <input id="photo-date" className="select-input" type="date" value={photoDate} onChange={(event) => setPhotoDate(event.target.value)} />
            <label className="field-label" htmlFor="photo-note">Note</label>
            <textarea id="photo-note" className="notes-field" value={photoNote} onChange={(event) => setPhotoNote(event.target.value)} placeholder="Front/side comparison, lighting, pump, travel week, etc." />
            <label className="field-label" htmlFor="photo-view">Photo angle</label>
            <select id="photo-view" className="select-input" value={photoView} onChange={(event) => setPhotoView(event.target.value as PhotoCheckInView)}>
              <option value="front">Front</option>
              <option value="side">Side</option>
              <option value="back">Back</option>
              <option value="other">Other</option>
            </select>
            {editingPhotoKey ? (
              <div className="cta-grid">
                <button className="install-button" onClick={savePhotoEdit}>Save photo details</button>
                <button className="secondary-action" onClick={cancelPhotoEdit}>Cancel</button>
              </div>
            ) : (
              <>
                <label className="secondary-action file-button" htmlFor="photo-file">Choose photo</label>
                <input id="photo-file" className="visually-hidden" type="file" accept="image/*" onChange={handlePhotoSelection} />
              </>
            )}
          </div>
          <div className="photo-grid">
            {sortedPhotos.length ? sortedPhotos.map((entry) => (
              <article className="photo-card" key={photoKey(entry)}>
                <img src={entry.imageDataUrl} alt={`Check-in from ${entry.date}`} className="photo-thumb" />
                <span className="card-kicker">{entry.date} · {(entry.view ?? 'other').toUpperCase()}</span>
                <p className="exercise-note">{entry.note || 'No note logged.'}</p>
                <div className="card-actions">
                  <button className="secondary-action compact-action" onClick={() => startPhotoEdit(entry)}>Edit</button>
                  <button className="secondary-action compact-action danger-action" onClick={() => confirmDeletePhoto(photoKey(entry), entry.view, entry.date)}>Delete</button>
                </div>
              </article>
            )) : <article className="exercise-card"><h3 className="exercise-name">No photo check-ins yet</h3><p className="exercise-note">Add periodic photos under similar lighting to compare body-composition change honestly.</p></article>}
          </div>
        </section>
      </section>

      <section className="content-stack second-row">
        <section className="panel form-stack">
          <header className="section-header">
            <div>
              <span className="panel-kicker">Body metrics</span>
              <h2 className="section-title">Log weight and waist</h2>
            </div>
          </header>
          <div className="metric-grid">
            <div>
              <label className="field-label" htmlFor="metric-date">Date</label>
              <input id="metric-date" className="select-input" type="date" value={metricDate} onChange={(event) => setMetricDate(event.target.value)} />
            </div>
            <div>
              <label className="field-label" htmlFor="metric-weight">Weight (lb)</label>
              <input id="metric-weight" className="select-input" type="number" inputMode="decimal" value={weightLbs} onChange={(event) => setWeightLbs(event.target.value)} />
            </div>
            <div>
              <label className="field-label" htmlFor="metric-waist">Waist (in)</label>
              <input id="metric-waist" className="select-input" type="number" inputMode="decimal" value={waistInches} onChange={(event) => setWaistInches(event.target.value)} />
            </div>
          </div>
          <div>
            <label className="field-label" htmlFor="metric-note">Note</label>
            <textarea id="metric-note" className="notes-field" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Morning weigh-in, travel week, sodium swing, great sleep, etc." />
          </div>
          <div className="cta-grid single-action">
            <button className="install-button" onClick={saveMetric}>{editingMetricDate ? 'Update metric' : 'Save metric'}</button>
            {editingMetricDate ? <button className="secondary-action" onClick={cancelMetricEdit}>Cancel edit</button> : null}
          </div>
        </section>

        <section className="panel">
          <header className="section-header">
            <div>
              <span className="panel-kicker">Recent trend points</span>
              <h2 className="section-title">Latest check-ins</h2>
            </div>
          </header>
          <div className="exercise-list">
            {sortedMetrics.length ? sortedMetrics.map((entry) => (
              <article className="exercise-card" key={entry.date}>
                <span className="card-kicker">{entry.date}</span>
                <h3 className="exercise-name">{entry.weightLbs} lb · {entry.waistInches} in</h3>
                <p className="exercise-note">{entry.note || 'No note logged.'}</p>
                <div className="card-actions">
                  <button className="secondary-action compact-action" onClick={() => startMetricEdit(entry)}>Edit</button>
                  <button className="secondary-action compact-action danger-action" onClick={() => confirmDeleteMetric(entry.date)}>Delete</button>
                </div>
              </article>
            )) : <article className="exercise-card"><h3 className="exercise-name">No body metrics yet</h3><p className="exercise-note">Log two or more check-ins to start comparing trend direction.</p></article>}
          </div>
        </section>
      </section>
    </PageWrapper>
  );
}