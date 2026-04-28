interface StrategicImplicationsProps {
  text: string;
}

export const StrategicImplications: React.FC<StrategicImplicationsProps> = ({ text }) => {
  return (
    <div className="border-l-4 border-accent pl-6">
      <p className="text-document-base leading-relaxed whitespace-pre-line font-body">
        {text}
      </p>
    </div>
  );
};
