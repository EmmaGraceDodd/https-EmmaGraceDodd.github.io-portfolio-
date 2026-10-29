/* Emma's favorite song, styled like her pink player.
   The album art is swapped for a spinning record so we're not reposting
   Queen's cover art; play opens the song on Spotify. */

const SPOTIFY = "https://open.spotify.com/search/Cool%20Cat%20Queen"

export function MusicPlayer() {
  return (
    <figure className="player reveal" aria-label="Emma's favorite song: Cool Cat by Queen">
      <div className="player-screen">
        <span className="player-label">On repeat</span>
        <div className="vinyl" aria-hidden="true">
          <span className="vinyl-label">
            <span>Cool Cat</span>
          </span>
        </div>
      </div>
      <figcaption className="player-meta">
        <strong>Cool Cat</strong>
        <span>Queen · Hot Space</span>
      </figcaption>
      <div className="player-progress" aria-hidden="true">
        <span />
      </div>
      <div className="player-times" aria-hidden="true">
        <span>1:12</span>
        <span>-2:17</span>
      </div>
      <div className="player-controls">
        <svg aria-hidden="true" viewBox="0 0 24 24" className="pc-small">
          <path d="M4 7h3l10 10h3M4 17h3l3-3M14 10l3-3h3M18 5l2 2-2 2M18 15l2 2-2 2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="M11 6 3 12l8 6V6zm9 0-8 6 8 6V6z" fill="currentColor" />
        </svg>
        <a className="player-play" href={SPOTIFY} target="_blank" rel="noreferrer" aria-label="Listen to Cool Cat by Queen on Spotify">
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" fill="currentColor" />
          </svg>
        </a>
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="M13 6l8 6-8 6V6zM4 6l8 6-8 6V6z" fill="currentColor" />
        </svg>
        <svg aria-hidden="true" viewBox="0 0 24 24" className="pc-small">
          <path d="M5 9a4 4 0 0 1 4-4h9l-3-3M19 15a4 4 0 0 1-4 4H6l3 3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </figure>
  )
}
