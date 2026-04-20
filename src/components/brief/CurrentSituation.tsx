interface CurrentSituationProps {
  text: string;
}

export const CurrentSituation: React.FC<CurrentSituationProps> = ({ text }) => {
  return (
    <div className="border-l-3 border-accent pl-6">
      <p className="text-document-base leading-relaxed whitespace-pre-line font-body text-justify">
        {text}
      </p>
    </div>
  );
};
