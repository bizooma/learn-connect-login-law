// Performance Testing Utilities for React Components
// Comprehensive testing suite for component performance analysis

import React from 'react';
import { renderDebugger, performanceTest } from '@/utils/renderDebugger';
import { renderPerformanceMonitor } from '@/utils/renderPerformanceMonitor';

interface ComponentTestResult {
  componentName: string;
  renderTime: number;
  score: number;
  recommendations: string[];
  issues: string[];
}

interface PerformanceTestSuite {
  name: string;
  tests: Array<{
    name: string;
    component: React.ComponentType<any>;
    props: any;
    expectedMaxRenderTime?: number;
  }>;
}

export class ComponentPerformanceTester {
  private testResults: ComponentTestResult[] = [];

  // Run performance tests on a component
  async testComponent(
    componentName: string,
    component: React.ComponentType<any>,
    props: any,
    options: {
      iterations?: number;
      expectedMaxRenderTime?: number;
      measureMemory?: boolean;
    } = {}
  ): Promise<ComponentTestResult> {
    const {
      iterations = 50,
      expectedMaxRenderTime = 16,
      measureMemory = true
    } = options;

    console.log(`🧪 Testing ${componentName}...`);

    // Run performance measurement
    const metrics = await performanceTest.measureRender(component, props, iterations);
    
    // Calculate score (0-100, higher is better)
    const score = Math.max(0, Math.min(100, 100 - (metrics.averageTime / expectedMaxRenderTime) * 100));
    
    // Generate recommendations
    const recommendations: string[] = [];
    const issues: string[] = [];

    if (metrics.averageTime > expectedMaxRenderTime) {
      issues.push(`Average render time (${metrics.averageTime.toFixed(2)}ms) exceeds target (${expectedMaxRenderTime}ms)`);
      recommendations.push('Consider using React.memo() for pure components');
      recommendations.push('Add useMemo() for expensive calculations');
      recommendations.push('Optimize re-render triggers with useCallback()');
    }

    if (metrics.maxTime > expectedMaxRenderTime * 3) {
      issues.push(`Maximum render time (${metrics.maxTime.toFixed(2)}ms) indicates performance spikes`);
      recommendations.push('Investigate inconsistent render performance');
      recommendations.push('Consider code splitting for heavy components');
    }

    if (measureMemory && 'memory' in performance) {
      const memory = (performance as any).memory;
      if (memory.usedJSHeapSize > 50 * 1024 * 1024) { // 50MB
        issues.push('High memory usage detected');
        recommendations.push('Check for memory leaks in useEffect cleanup');
        recommendations.push('Optimize data structures and avoid large object retention');
      }
    }

    const result: ComponentTestResult = {
      componentName,
      renderTime: metrics.averageTime,
      score,
      recommendations,
      issues
    };

    this.testResults.push(result);
    this.logTestResult(result);

    return result;
  }

  // Run a complete test suite
  async runTestSuite(suite: PerformanceTestSuite): Promise<ComponentTestResult[]> {
    console.group(`🔬 Running Performance Test Suite: ${suite.name}`);
    
    const results: ComponentTestResult[] = [];
    
    for (const test of suite.tests) {
      const result = await this.testComponent(
        test.name,
        test.component,
        test.props,
        { expectedMaxRenderTime: test.expectedMaxRenderTime }
      );
      results.push(result);
    }

    console.groupEnd();
    this.generateSuiteReport(suite.name, results);
    
    return results;
  }

  // Generate performance report
  generateReport(): void {
    console.group('📈 Component Performance Report');
    
    const totalComponents = this.testResults.length;
    const averageScore = this.testResults.reduce((sum, r) => sum + r.score, 0) / totalComponents;
    const slowComponents = this.testResults.filter(r => r.score < 70);
    
    console.log(`📊 Total components tested: ${totalComponents}`);
    console.log(`⭐ Average performance score: ${averageScore.toFixed(1)}/100`);
    console.log(`🐌 Components needing optimization: ${slowComponents.length}`);

    if (slowComponents.length > 0) {
      console.group('🔧 Components Needing Attention');
      slowComponents
        .sort((a, b) => a.score - b.score)
        .forEach(component => {
          console.log(`${component.componentName}: ${component.score.toFixed(1)}/100 (${component.renderTime.toFixed(2)}ms)`);
        });
      console.groupEnd();
    }

    const allRecommendations = this.testResults
      .flatMap(r => r.recommendations)
      .reduce((acc, rec) => {
        acc[rec] = (acc[rec] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    if (Object.keys(allRecommendations).length > 0) {
      console.group('💡 Top Recommendations');
      Object.entries(allRecommendations)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .forEach(([recommendation, count]) => {
          console.log(`${recommendation} (${count} components)`);
        });
      console.groupEnd();
    }

    console.groupEnd();
  }

  // Get detailed analysis for a specific component
  getComponentAnalysis(componentName: string): ComponentTestResult | null {
    return this.testResults.find(r => r.componentName === componentName) || null;
  }

  // Export results as JSON
  exportResults(): string {
    return JSON.stringify({
      testResults: this.testResults,
      summary: {
        totalComponents: this.testResults.length,
        averageScore: this.testResults.reduce((sum, r) => sum + r.score, 0) / this.testResults.length,
        slowComponents: this.testResults.filter(r => r.score < 70).length,
        generatedAt: new Date().toISOString()
      }
    }, null, 2);
  }

  // Clear all test results
  clear(): void {
    this.testResults = [];
  }

  private logTestResult(result: ComponentTestResult): void {
    const emoji = result.score >= 90 ? '🚀' : result.score >= 70 ? '✅' : result.score >= 50 ? '⚠️' : '❌';
    console.log(`${emoji} ${result.componentName}: ${result.score.toFixed(1)}/100 (${result.renderTime.toFixed(2)}ms)`);
    
    if (result.issues.length > 0) {
      console.warn(`Issues: ${result.issues.join(', ')}`);
    }
  }

  private generateSuiteReport(suiteName: string, results: ComponentTestResult[]): void {
    const averageScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
    const bestComponent = results.reduce((best, current) => current.score > best.score ? current : best);
    const worstComponent = results.reduce((worst, current) => current.score < worst.score ? current : worst);

    console.log(`\n📋 Suite Summary for "${suiteName}":`);
    console.log(`Average Score: ${averageScore.toFixed(1)}/100`);
    console.log(`Best Performer: ${bestComponent.componentName} (${bestComponent.score.toFixed(1)}/100)`);
    console.log(`Needs Improvement: ${worstComponent.componentName} (${worstComponent.score.toFixed(1)}/100)`);
  }
}

// Global tester instance
export const componentTester = new ComponentPerformanceTester();

// Convenience functions for quick testing
export const quickTest = {
  // Test a single component quickly
  component: async (component: React.ComponentType<any>, props: any = {}) => {
    return await componentTester.testComponent(
      component.displayName || component.name || 'Unknown',
      component,
      props
    );
  },

  // Test leaderboard components specifically
  leaderboards: async () => {
    const { default: MiniLeaderboard } = await import('@/components/leaderboards/MiniLeaderboard');
    const { default: StreakLeaderboard } = await import('@/components/leaderboards/StreakLeaderboard');
    const { default: CategoryLeaderboard } = await import('@/components/leaderboards/CategoryLeaderboard');

    const suite: PerformanceTestSuite = {
      name: 'Leaderboard Components',
      tests: [
        {
          name: 'MiniLeaderboard (Streak)',
          component: MiniLeaderboard,
          props: { type: 'learning_streak', title: 'Learning Streak', limit: 5 },
          expectedMaxRenderTime: 10
        },
        {
          name: 'MiniLeaderboard (Sales)',
          component: MiniLeaderboard,
          props: { type: 'sales_training', title: 'Sales Training', limit: 5 },
          expectedMaxRenderTime: 10
        },
        {
          name: 'StreakLeaderboard',
          component: StreakLeaderboard,
          props: {},
          expectedMaxRenderTime: 15
        },
        {
          name: 'CategoryLeaderboard (Sales)',
          component: CategoryLeaderboard,
          props: { category: 'Sales' },
          expectedMaxRenderTime: 15
        }
      ]
    };

    return await componentTester.runTestSuite(suite);
  }
};

// Development helper functions
export const devTools = {
  startDebugging: () => renderDebugger.startRecording(),
  stopDebugging: () => renderDebugger.stopRecording(),
  analyzeComponent: (name: string) => renderDebugger.analyzeComponent(name),
  getPerformanceReport: () => renderPerformanceMonitor.getPerformanceSummary(),
  runLeaderboardTests: () => quickTest.leaderboards(),
  generateFullReport: () => componentTester.generateReport()
};