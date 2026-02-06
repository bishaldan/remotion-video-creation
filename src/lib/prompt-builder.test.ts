import { describe, expect, it } from 'vitest';
import { buildPrompt } from './prompt-builder';

describe('buildPrompt', () => {
  describe('PDF-only mode', () => {
    it('should create prompt with PDF content', () => {
      const result = buildPrompt({
        pdfText: 'This is sample PDF content about machine learning.',
        pdfMetadata: {
          title: 'ML Basics',
          pageCount: 5
        }
      });

      expect(result).toContain('You are generating an educational video timeline');
      expect(result).toContain('PDF Title: ML Basics');
      expect(result).toContain('Pages: 5');
      expect(result).toContain('This is sample PDF content about machine learning.');
      expect(result).toContain('Create an educational video timeline that covers the key concepts');
    });

    it('should handle missing metadata title', () => {
      const result = buildPrompt({
        pdfText: 'Sample content',
        pdfMetadata: {
          pageCount: 3
        }
      });

      expect(result).toContain('PDF Title: Untitled');
      expect(result).toContain('Pages: 3');
    });
  });

  describe('Text-only mode', () => {
    it('should create prompt from user text prompt', () => {
      const result = buildPrompt({
        userPrompt: 'Introduction to Python programming'
      });

      expect(result).toBe('Create an educational video timeline for the topic: "Introduction to Python programming"');
    });
  });

  describe('Combined mode', () => {
    it('should prioritize PDF content and include user prompt as additional context', () => {
      const result = buildPrompt({
        pdfText: 'PDF content about algorithms',
        pdfMetadata: {
          title: 'Algorithms 101',
          pageCount: 10
        },
        userPrompt: 'Focus on sorting algorithms'
      });

      expect(result).toContain('You are generating an educational video timeline');
      expect(result).toContain('PDF Title: Algorithms 101');
      expect(result).toContain('PDF content about algorithms');
      expect(result).toContain('Additional Context: Focus on sorting algorithms');
      expect(result).toContain('Create an educational video timeline that covers the key concepts');
    });
  });

  describe('Error handling', () => {
    it('should throw error when neither pdfText nor userPrompt is provided', () => {
      expect(() => buildPrompt({})).toThrow('Either pdfText or userPrompt must be provided');
    });
  });
});
