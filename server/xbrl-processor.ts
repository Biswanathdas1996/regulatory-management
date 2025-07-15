import * as fs from 'fs';
import * as path from 'path';
import * as xml2js from 'xml2js';
import { create } from 'xmlbuilder2';
import { DOMParser } from 'xmldom';
import * as xpath from 'xpath';

export interface XBRLConcept {
  name: string;
  type: string;
  period: string;
  value: string | number;
  unit?: string;
  context?: string;
  decimals?: number;
  namespace?: string;
}

export interface XBRLContext {
  id: string;
  entity: string;
  period: {
    startDate?: string;
    endDate?: string;
    instant?: string;
  };
}

export interface XBRLUnit {
  id: string;
  measure: string;
}

export interface XBRLTaxonomy {
  concepts: Array<{
    name: string;
    type: string;
    label: string;
    documentation?: string;
    abstract?: boolean;
    periodType?: string;
    balance?: string;
  }>;
  presentations: Array<{
    role: string;
    concepts: Array<{
      name: string;
      order: number;
      parent?: string;
    }>;
  }>;
}

export interface XBRLInstance {
  schemaRef: string;
  contexts: XBRLContext[];
  units: XBRLUnit[];
  facts: XBRLConcept[];
  metadata: {
    entity: string;
    period: string;
    currency: string;
    language: string;
  };
}

export interface XBRLTemplate {
  taxonomy: XBRLTaxonomy;
  requiredConcepts: string[];
  validationRules: Array<{
    concept: string;
    rule: string;
    message: string;
  }>;
  reportingPeriods: string[];
  currencies: string[];
}

export class XBRLProcessor {
  private parser: xml2js.Parser;

  constructor() {
    this.parser = new xml2js.Parser({
      explicitArray: false,
      ignoreAttrs: false,
      mergeAttrs: true,
      trim: true,
      normalizeTags: true,
      normalize: true
    });
  }

  /**
   * Parse XBRL instance document
   */
  async parseXBRLInstance(filePath: string): Promise<XBRLInstance> {
    const xmlContent = fs.readFileSync(filePath, 'utf8');
    const result = await this.parser.parseStringPromise(xmlContent);
    
    const doc = new DOMParser().parseFromString(xmlContent, 'text/xml');
    const select = xpath.useNamespaces({
      'xbrli': 'http://www.xbrl.org/2003/instance',
      'link': 'http://www.xbrl.org/2003/linkbase',
      'xlink': 'http://www.w3.org/1999/xlink'
    });

    // Extract contexts
    const contexts = this.extractContexts(doc, select);
    
    // Extract units
    const units = this.extractUnits(doc, select);
    
    // Extract facts
    const facts = this.extractFacts(doc, select);
    
    // Extract metadata
    const metadata = this.extractMetadata(doc, select);
    
    // Get schema reference
    const schemaRef = this.extractSchemaReference(doc, select);

    return {
      schemaRef,
      contexts,
      units,
      facts,
      metadata
    };
  }

  /**
   * Parse XBRL taxonomy schema
   */
  async parseXBRLTaxonomy(schemaPath: string): Promise<XBRLTaxonomy> {
    const xmlContent = fs.readFileSync(schemaPath, 'utf8');
    const doc = new DOMParser().parseFromString(xmlContent, 'text/xml');
    const select = xpath.useNamespaces({
      'xs': 'http://www.w3.org/2001/XMLSchema',
      'xbrli': 'http://www.xbrl.org/2003/instance',
      'link': 'http://www.xbrl.org/2003/linkbase'
    });

    // Extract concepts from schema
    const concepts = this.extractConcepts(doc, select);
    
    // Extract presentation linkbase (if embedded)
    const presentations = this.extractPresentations(doc, select);

    return {
      concepts,
      presentations
    };
  }

  /**
   * Create XBRL template from taxonomy
   */
  async createXBRLTemplate(taxonomyPath: string): Promise<XBRLTemplate> {
    const taxonomy = await this.parseXBRLTaxonomy(taxonomyPath);
    
    // Extract required concepts (non-abstract concepts)
    const requiredConcepts = taxonomy.concepts
      .filter(c => !c.abstract)
      .map(c => c.name);

    // Create basic validation rules
    const validationRules = taxonomy.concepts
      .filter(c => !c.abstract)
      .map(c => ({
        concept: c.name,
        rule: c.type === 'monetary' ? 'numeric' : 'required',
        message: `${c.label || c.name} is required`
      }));

    return {
      taxonomy,
      requiredConcepts,
      validationRules,
      reportingPeriods: ['quarterly', 'annual'],
      currencies: ['USD', 'EUR', 'GBP', 'INR']
    };
  }

  /**
   * Validate XBRL instance against template
   */
  async validateXBRLInstance(instancePath: string, template: XBRLTemplate): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const instance = await this.parseXBRLInstance(instancePath);
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required concepts
    const providedConcepts = instance.facts.map(f => f.name);
    const missingConcepts = template.requiredConcepts.filter(
      concept => !providedConcepts.includes(concept)
    );

    if (missingConcepts.length > 0) {
      errors.push(`Missing required concepts: ${missingConcepts.join(', ')}`);
    }

    // Validate each fact against rules
    for (const fact of instance.facts) {
      const rules = template.validationRules.filter(r => r.concept === fact.name);
      
      for (const rule of rules) {
        const validation = this.validateFact(fact, rule);
        if (!validation.isValid) {
          errors.push(`${fact.name}: ${validation.message}`);
        }
      }
    }

    // Check contexts are valid
    for (const context of instance.contexts) {
      if (!context.entity) {
        errors.push(`Context ${context.id} missing entity information`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Generate XBRL report from validated data
   */
  async generateXBRLReport(instanceData: XBRLInstance, outputPath: string): Promise<void> {
    const root = create({ version: '1.0', encoding: 'UTF-8' })
      .ele('xbrli:xbrl')
      .att('xmlns:xbrli', 'http://www.xbrl.org/2003/instance')
      .att('xmlns:xlink', 'http://www.w3.org/1999/xlink')
      .att('xmlns:xsi', 'http://www.w3.org/2001/XMLSchema-instance');

    // Add schema reference
    root.ele('link:schemaRef')
      .att('xlink:type', 'simple')
      .att('xlink:href', instanceData.schemaRef);

    // Add contexts
    for (const context of instanceData.contexts) {
      const contextElem = root.ele('xbrli:context')
        .att('id', context.id);

      contextElem.ele('xbrli:entity')
        .ele('xbrli:identifier')
        .att('scheme', 'http://www.sec.gov/CIK')
        .txt(context.entity);

      const periodElem = contextElem.ele('xbrli:period');
      if (context.period.instant) {
        periodElem.ele('xbrli:instant').txt(context.period.instant);
      } else if (context.period.startDate && context.period.endDate) {
        periodElem.ele('xbrli:startDate').txt(context.period.startDate);
        periodElem.ele('xbrli:endDate').txt(context.period.endDate);
      }
    }

    // Add units
    for (const unit of instanceData.units) {
      root.ele('xbrli:unit')
        .att('id', unit.id)
        .ele('xbrli:measure')
        .txt(unit.measure);
    }

    // Add facts
    for (const fact of instanceData.facts) {
      const factElem = root.ele(fact.name)
        .att('contextRef', fact.context || 'default')
        .txt(fact.value.toString());

      if (fact.unit) {
        factElem.att('unitRef', fact.unit);
      }
      if (fact.decimals !== undefined) {
        factElem.att('decimals', fact.decimals.toString());
      }
    }

    // Write to file
    const xmlString = root.end({ prettyPrint: true });
    fs.writeFileSync(outputPath, xmlString);
  }

  /**
   * Convert Excel template to XBRL template structure
   */
  async convertExcelToXBRLTemplate(excelPath: string): Promise<XBRLTemplate> {
    // This would integrate with your existing Excel processor
    // For now, return a basic template structure
    return {
      taxonomy: {
        concepts: [],
        presentations: []
      },
      requiredConcepts: [],
      validationRules: [],
      reportingPeriods: ['quarterly', 'annual'],
      currencies: ['USD', 'EUR', 'GBP', 'INR']
    };
  }

  private extractContexts(doc: Document, select: any): XBRLContext[] {
    const contextNodes = select('//xbrli:context', doc);
    const contexts: XBRLContext[] = [];

    for (const node of contextNodes) {
      const id = node.getAttribute('id');
      const entityNode = select('.//xbrli:entity/xbrli:identifier', node)[0];
      const entity = entityNode ? entityNode.textContent : '';

      const instantNode = select('.//xbrli:period/xbrli:instant', node)[0];
      const startDateNode = select('.//xbrli:period/xbrli:startDate', node)[0];
      const endDateNode = select('.//xbrli:period/xbrli:endDate', node)[0];

      const period: XBRLContext['period'] = {};
      if (instantNode) {
        period.instant = instantNode.textContent;
      } else if (startDateNode && endDateNode) {
        period.startDate = startDateNode.textContent;
        period.endDate = endDateNode.textContent;
      }

      contexts.push({ id, entity, period });
    }

    return contexts;
  }

  private extractUnits(doc: Document, select: any): XBRLUnit[] {
    const unitNodes = select('//xbrli:unit', doc);
    const units: XBRLUnit[] = [];

    for (const node of unitNodes) {
      const id = node.getAttribute('id');
      const measureNode = select('.//xbrli:measure', node)[0];
      const measure = measureNode ? measureNode.textContent : '';

      units.push({ id, measure });
    }

    return units;
  }

  private extractFacts(doc: Document, select: any): XBRLConcept[] {
    const facts: XBRLConcept[] = [];
    const allElements = doc.getElementsByTagName('*');

    for (let i = 0; i < allElements.length; i++) {
      const element = allElements[i];
      const contextRef = element.getAttribute('contextRef');
      const unitRef = element.getAttribute('unitRef');
      const decimals = element.getAttribute('decimals');

      if (contextRef && element.textContent) {
        const fact: XBRLConcept = {
          name: element.tagName,
          type: 'string',
          period: 'instant',
          value: element.textContent,
          context: contextRef
        };

        if (unitRef) fact.unit = unitRef;
        if (decimals) fact.decimals = parseInt(decimals);

        facts.push(fact);
      }
    }

    return facts;
  }

  private extractMetadata(doc: Document, select: any): XBRLInstance['metadata'] {
    return {
      entity: 'Default Entity',
      period: '2024',
      currency: 'USD',
      language: 'en'
    };
  }

  private extractSchemaReference(doc: Document, select: any): string {
    const schemaRefNode = select('//link:schemaRef', doc)[0];
    return schemaRefNode ? schemaRefNode.getAttribute('xlink:href') : '';
  }

  private extractConcepts(doc: Document, select: any): XBRLTaxonomy['concepts'] {
    const elementNodes = select('//xs:element', doc);
    const concepts: XBRLTaxonomy['concepts'] = [];

    for (const node of elementNodes) {
      const name = node.getAttribute('name');
      const type = node.getAttribute('type');
      const abstract = node.getAttribute('abstract') === 'true';
      const periodType = node.getAttribute('xbrli:periodType');
      const balance = node.getAttribute('xbrli:balance');

      if (name) {
        concepts.push({
          name,
          type: type || 'string',
          label: name,
          abstract,
          periodType,
          balance
        });
      }
    }

    return concepts;
  }

  private extractPresentations(doc: Document, select: any): XBRLTaxonomy['presentations'] {
    // This would extract presentation linkbase information
    // For now, return empty array
    return [];
  }

  private validateFact(fact: XBRLConcept, rule: { concept: string; rule: string; message: string }): { isValid: boolean; message: string } {
    switch (rule.rule) {
      case 'numeric':
        const numValue = parseFloat(fact.value.toString());
        return {
          isValid: !isNaN(numValue),
          message: isNaN(numValue) ? `${fact.name} must be a valid number` : ''
        };
      case 'required':
        return {
          isValid: fact.value !== null && fact.value !== undefined && fact.value !== '',
          message: !fact.value ? `${fact.name} is required` : ''
        };
      default:
        return { isValid: true, message: '' };
    }
  }
}

export const xbrlProcessor = new XBRLProcessor();