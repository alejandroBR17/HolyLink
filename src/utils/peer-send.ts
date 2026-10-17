interface PeerTransport {
  open: boolean;
  bufferSize?: number;
  dataChannel?: {bufferedAmount: number};
  send: (message: unknown) => void;
}

/** Keep media out of the way of live controls and do not fill an unbounded RTC send queue. */
export async function sendPeerChunk(conn: PeerTransport, message: unknown, authorized: () => boolean, timeoutMs = 30_000): Promise<void> {
  const start = performance.now();
  while ((conn.dataChannel?.bufferedAmount || 0) > 256 * 1024 || (conn.bufferSize || 0) > 0) {
    if (!conn.open || !authorized()) throw new Error('Transferência interrompida: aparelho desconectado.');
    if (performance.now() - start >= timeoutMs) throw new Error('A transferência parou de responder. Confira a rede e tente novamente.');
    await new Promise(resolve => setTimeout(resolve, 25));
  }
  if (!conn.open || !authorized()) throw new Error('Transferência interrompida: aparelho desconectado.');
  conn.send(message);
}
