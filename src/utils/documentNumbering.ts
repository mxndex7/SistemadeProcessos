import { Processo } from "../types";

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();

const extractFirstNumber = (value: string) => {
  const match = value.match(/\d+/);
  return match ? Number(match[0]) : 0;
};

export const getNextDocumentNumber = (
  processos: Processo[],
  unidade: string,
  tipoDocumento: string
) => {
  const normalizedType = normalize(tipoDocumento);

  const maxNumber = processos
    .flatMap((processo) => processo.documentos)
    .filter((documento) => documento.unidadeGeradora === unidade)
    .filter((documento) => normalize(documento.tipo) === normalizedType)
    .reduce((max, documento) => {
      const source = `${documento.seiNumero} ${documento.titulo || ""} ${documento.nomeNaArvore || ""}`;
      return Math.max(max, extractFirstNumber(source));
    }, 0);

  return maxNumber + 1;
};
