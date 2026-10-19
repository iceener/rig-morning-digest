import type { NightDigest } from '../digest/types.js';

export function DigestPage({ night, digest }: { night: string; digest: NightDigest }) {
  return (
    <>
      <h1>digest · {night}</h1>
      {digest.malformedLines > 0 && (
        <p class="warn">{digest.malformedLines} malformed {digest.malformedLines === 1 ? 'line' : 'lines'} skipped</p>
      )}
      {digest.rows.length === 0 ? (
        <p class="mute">nothing ran</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th scope="col">job</th>
              <th scope="col">owner</th>
              <th scope="col">runs</th>
              <th scope="col">retries</th>
              <th scope="col">last status</th>
              <th scope="col">last error</th>
              <th scope="col">first time</th>
              <th scope="col">last time</th>
              <th scope="col">notes</th>
            </tr>
          </thead>
          <tbody>
            {digest.rows.map((row) => {
              const needsAttention = row.retries >= 3 || row.hadFailure;
              const notes = [
                ...(row.retries >= 3 ? ['3 or more retries'] : []),
                ...(row.hadFailure ? ['failure observed'] : []),
              ];
              return (
                <tr>
                  <td>{row.job}</td>
                  <td>{row.owner ?? '—'}</td>
                  <td>{row.runs}</td>
                  <td class={row.retries >= 3 ? 'warn' : undefined}>
                    {row.retries >= 3 ? <strong>{row.retries} (3 or more)</strong> : row.retries}
                  </td>
                  <td class={row.hadFailure ? 'warn' : undefined}>{row.lastStatus}</td>
                  <td class={row.lastError ? 'warn' : undefined}>{row.lastError ?? '—'}</td>
                  <td>{row.firstAt}</td>
                  <td>{row.lastAt}</td>
                  <td class={needsAttention ? 'warn' : undefined}>{notes.length > 0 ? notes.join('; ') : '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </>
  );
}
