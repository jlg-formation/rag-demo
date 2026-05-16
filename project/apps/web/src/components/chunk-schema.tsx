type ChunkSchemaProps = {
  chunkSize: number;
  chunkOverlap: number;
};

export function ChunkingSchema({ chunkSize, chunkOverlap }: ChunkSchemaProps) {
  const stride = Math.max(1, chunkSize - chunkOverlap);
  const totalLength = chunkSize + stride * 2;
  const summary = [
    `Taille du chunk : ${chunkSize}`,
    `overlap : ${chunkOverlap}`,
    `stride : ${stride}`
  ].join(" · ");
  const windows = [0, stride, stride * 2].map((start, index) => ({
    index,
    start
  }));
  const markers = Array.from(
    new Set([0, stride, chunkSize, stride + chunkSize, totalLength])
  ).sort((left, right) => left - right);
  const toPercent = (value: number) => `${(value / totalLength) * 100}%`;

  return (
    <div className="chunk-schema" aria-hidden="true">
      <div className="chunk-schema__header">
        <p className="chunk-schema__title">Schéma de découpage</p>
        <p className="chunk-schema__summary">{summary}</p>
      </div>

      <div className="chunk-schema__canvas">
        <div className="chunk-schema__frame">
          <div className="chunk-schema__scale">
            {markers.map((marker) => (
              <div
                className="chunk-schema__tick"
                key={marker}
                style={{ left: toPercent(marker) }}
              >
                <span className="chunk-schema__tick-label">{marker}</span>
              </div>
            ))}
          </div>

          <div className="chunk-schema__rows">
            {windows.map((window) => (
              <div className="chunk-schema__row" key={window.index}>
                <div
                  className="chunk-schema__segment"
                  style={{
                    left: toPercent(window.start),
                    width: toPercent(chunkSize)
                  }}
                >
                  <span>Chunk {window.index + 1}</span>
                </div>
              </div>
            ))}
          </div>

          <div
            className="chunk-schema__guide"
            style={{ left: toPercent(stride) }}
          />
          <div
            className="chunk-schema__guide"
            style={{ left: toPercent(chunkSize) }}
          />

          <div
            className="chunk-schema__arrow chunk-schema__arrow--stride"
            style={{ left: 0, width: toPercent(stride) }}
          >
            <span>{stride}</span>
          </div>

          <div
            className="chunk-schema__arrow chunk-schema__arrow--overlap"
            style={{ left: toPercent(stride), width: toPercent(chunkOverlap) }}
          >
            <span>{chunkOverlap}</span>
          </div>
        </div>

        <div className="chunk-schema__legend">
          <span>
            Un chunk couvre {chunkSize} unités, avec un overlap de{" "}
            {chunkOverlap} avec le suivant, pour un stride effectif de {stride}.
          </span>
        </div>
      </div>
    </div>
  );
}
