import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { 
  DESIGN_TOKENS, 
  DIALOG_SIZES, 
  PAGE_SIZES,
  getFormFieldClasses,
  getCardClasses,
  getEmptyStateClasses
} from './design-tokens';

describe('Design Tokens', () => {
  describe('Property 12: Design Token Application Consistency', () => {
    /**
     * Feature: codebase-refactoring, Property 12: Design Token Application Consistency
     * For any component using design tokens, colors, spacing, borders, and typography 
     * should follow the standardized token values defined in DESIGN_TOKENS
     * Validates: Requirements 8.1, 8.2, 8.3, 8.4
     */
    it('should provide consistent color tokens', () => {
      fc.assert(fc.property(
        fc.constantFrom(...Object.keys(DESIGN_TOKENS.colors)),
        (colorKey) => {
          const colorValue = DESIGN_TOKENS.colors[colorKey as keyof typeof DESIGN_TOKENS.colors];
          expect(colorValue).toMatch(/^text-/);
          expect(colorValue).toBeTruthy();
        }
      ), { numRuns: 100 });
    });

    it('should provide consistent background tokens', () => {
      fc.assert(fc.property(
        fc.constantFrom(...Object.keys(DESIGN_TOKENS.backgrounds)),
        (bgKey) => {
          const bgValue = DESIGN_TOKENS.backgrounds[bgKey as keyof typeof DESIGN_TOKENS.backgrounds];
          expect(bgValue).toMatch(/^bg-/);
          expect(bgValue).toBeTruthy();
        }
      ), { numRuns: 100 });
    });

    it('should provide consistent border tokens', () => {
      fc.assert(fc.property(
        fc.constantFrom(...Object.keys(DESIGN_TOKENS.borders)),
        (borderKey) => {
          const borderValue = DESIGN_TOKENS.borders[borderKey as keyof typeof DESIGN_TOKENS.borders];
          expect(borderValue).toMatch(/^border-/);
          expect(borderValue).toBeTruthy();
        }
      ), { numRuns: 100 });
    });

    it('should provide consistent spacing tokens', () => {
      fc.assert(fc.property(
        fc.constantFrom(...Object.keys(DESIGN_TOKENS.spacing)),
        (spacingKey) => {
          const spacingValue = DESIGN_TOKENS.spacing[spacingKey as keyof typeof DESIGN_TOKENS.spacing];
          expect(spacingValue).toMatch(/^p-/);
          expect(spacingValue).toBeTruthy();
        }
      ), { numRuns: 100 });
    });

    it('should provide consistent gap tokens', () => {
      fc.assert(fc.property(
        fc.constantFrom(...Object.keys(DESIGN_TOKENS.gaps)),
        (gapKey) => {
          const gapValue = DESIGN_TOKENS.gaps[gapKey as keyof typeof DESIGN_TOKENS.gaps];
          expect(gapValue).toMatch(/^gap-/);
          expect(gapValue).toBeTruthy();
        }
      ), { numRuns: 100 });
    });
  });

  describe('Utility Functions', () => {
    it('should generate consistent form field classes', () => {
      fc.assert(fc.property(
        fc.boolean(),
        (hasError) => {
          const classes = getFormFieldClasses(hasError);
          expect(classes).toContain(DESIGN_TOKENS.backgrounds.input);
          expect(classes).toContain(DESIGN_TOKENS.borders.default);
          expect(classes).toContain(DESIGN_TOKENS.focus.ring);
          
          if (hasError) {
            expect(classes).toContain(DESIGN_TOKENS.borders.error);
            expect(classes).toContain(DESIGN_TOKENS.focus.errorRing);
          }
        }
      ), { numRuns: 100 });
    });

    it('should generate consistent card classes', () => {
      const classes = getCardClasses();
      expect(classes).toContain(DESIGN_TOKENS.backgrounds.card);
      expect(classes).toContain(DESIGN_TOKENS.borders.default);
      expect(classes).toContain('hover:border-primary/30');
      expect(classes).toContain('transition-all');
    });

    it('should generate consistent empty state classes', () => {
      const classes = getEmptyStateClasses();
      expect(classes).toContain(DESIGN_TOKENS.backgrounds.card);
      expect(classes).toContain('border-dashed');
      expect(classes).toContain(DESIGN_TOKENS.borders.default);
    });
  });

  describe('Constants', () => {
    it('should have valid dialog sizes', () => {
      Object.values(DIALOG_SIZES).forEach(size => {
        expect(size).toMatch(/^sm:max-w-/);
      });
    });

    it('should have valid page sizes', () => {
      Object.values(PAGE_SIZES).forEach(size => {
        expect(typeof size).toBe('number');
        expect(size).toBeGreaterThan(0);
      });
    });
  });
});