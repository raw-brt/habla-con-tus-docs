import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@radix-ui/react-accordion";
import { FC } from "react";
import { ReactMarkdown } from "react-markdown/lib/react-markdown";

interface Props {
  sourceDocs: any;
}

export const Source: FC<Props> = ({ sourceDocs }) => {

  return (  <div className="p-5">
  <Accordion type="single" collapsible className="flex-col">
    {sourceDocs.map((doc: any, index: number) => (
      <div key={`SourceDocs-${index}`}>
        <AccordionItem value={`item-${index}`}>
          <AccordionTrigger>
            <h3>Source {index + 1}</h3>
          </AccordionTrigger>
          <AccordionContent>
            <ReactMarkdown linkTarget="_blank">
              {doc.pageContent}
            </ReactMarkdown>
          </AccordionContent>
        </AccordionItem>
      </div>
    ))}
  </Accordion>
</div>);

};