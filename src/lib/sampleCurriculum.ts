import type { Curriculum } from '@/types/curriculum'

/**
 * Seed curriculum — the canonical sample chapter.
 *
 * Chapter 1 · 5 units · 11 lessons · 24 activities. It deliberately covers
 * every feature the studio has to handle: all four activity types, an empty
 * lesson, a boss unit + boss lesson, lesson ordering and unit grouping.
 */
export const sampleCurriculum: Curriculum = {
  chapter: {
    id: 'chapter-01',
    title: 'The First Blocks',
    description: 'Build your algorithm instincts, one block at a time.',
    number: 1,
  },
  units: [
    {
      id: 'first-steps',
      title: 'First Steps',
      iconKey: 'foundations',
      lessonIds: ['welcome'],
    },
    {
      id: 'array-foundations',
      title: 'Array Foundations',
      iconKey: 'coding',
      lessonIds: ['arrays', 'indexes', 'accessing'],
    },
    {
      id: 'array-explorer',
      title: 'Array Explorer',
      iconKey: 'book',
      lessonIds: [
        'walking-array',
        'finding-element',
        'linear-search',
        'complexity',
        'review',
      ],
    },
    {
      id: 'array-guardian',
      title: 'Array Guardian',
      iconKey: 'challenge',
      lessonIds: ['boss-battle'],
      isBoss: true,
    },
    {
      id: 'next-frontier',
      title: 'Next Frontier',
      iconKey: 'practice',
      lessonIds: ['next-frontier'],
    },
  ],
  lessons: [
    {
      id: 'welcome',
      title: 'Welcome to DSA',
      description: 'Discover how instructions become algorithms.',
      skill: 'Foundations',
      estimatedMinutes: 3,
      order: 1,
      icon: '👋',
      activities: [
        {
          id: 'welcome-01',
          type: 'explanation',
          title: 'Think in steps',
          content:
            'An algorithm is simply a clear set of steps for solving a problem. You already use them every day—like following a recipe.',
          visual: 'search',
        },
        {
          id: 'welcome-02',
          type: 'multiple_choice',
          title: 'Choose a strategy',
          question:
            'You need to find a number inside a list. What is one reliable approach?',
          options: [
            'Check each number one by one',
            'Guess a random position',
            'Delete the list',
          ],
          answer: 0,
          explanation:
            'Exactly! Checking items one by one is a real algorithm called linear search.',
        },
        {
          id: 'welcome-03',
          type: 'true_false',
          title: 'Algorithm check',
          statement:
            'An algorithm should describe a repeatable sequence of steps.',
          answer: true,
          explanation:
            'Right. Repeatable, unambiguous steps are what make an algorithm useful.',
        },
      ],
    },
    {
      id: 'arrays',
      title: 'Meet Arrays',
      description: 'Store related values together in one ordered row.',
      skill: 'Arrays',
      estimatedMinutes: 3,
      order: 2,
      icon: '🧱',
      activities: [
        {
          id: 'arrays-01',
          type: 'explanation',
          title: 'Values in a row',
          content:
            'An array stores multiple values in order. Each value sits in its own slot, and the slots never change places on their own.',
          visual: 'array',
        },
        {
          id: 'arrays-02',
          type: 'multiple_choice',
          title: 'Spot the array',
          question: 'Which value looks like an array of scores?',
          options: ['[12, 18, 24]', 'score = 12', '12 + 18'],
          answer: 0,
          explanation:
            'Nice! Square brackets commonly show an ordered collection of values.',
          hint: 'Look for the square brackets.',
        },
        {
          id: 'arrays-03',
          type: 'fill_blank',
          title: 'Complete the idea',
          prompt: 'An array keeps its values in a fixed ____.',
          answer: 'order',
          acceptableAnswers: ['sequence'],
          hint: 'It is what makes position meaningful.',
          explanation: 'Correct! Order is what gives every slot a stable position.',
        },
      ],
    },
    {
      id: 'indexes',
      title: 'Meet Indexes',
      description: 'Every slot in an array has a number that names it.',
      skill: 'Arrays',
      estimatedMinutes: 3,
      order: 3,
      icon: '🔢',
      activities: [
        {
          id: 'indexes-01',
          type: 'explanation',
          title: 'Zero-based counting',
          content:
            'Most languages number array slots starting at 0. The first element lives at index 0, the second at index 1, and so on.',
          visual: 'index',
        },
        {
          id: 'indexes-02',
          type: 'true_false',
          title: 'Quick check',
          statement: 'The first element of an array usually has index 0.',
          answer: true,
          explanation: 'Correct! Counting starts at zero.',
        },
        {
          id: 'indexes-03',
          type: 'fill_blank',
          title: 'Name the position',
          prompt: 'The first array element is usually at index ____.',
          answer: '0',
          acceptableAnswers: ['zero'],
          hint: 'Programmers usually start counting from zero.',
          explanation: 'Correct!',
        },
      ],
    },
    {
      id: 'accessing',
      title: 'Read an Index',
      description: 'Reach straight into an array and pull out one value.',
      skill: 'Arrays',
      estimatedMinutes: 4,
      order: 4,
      icon: '🎯',
      activities: [
        {
          id: 'accessing-01',
          type: 'explanation',
          title: 'Direct access',
          content:
            'Reading scores[2] jumps straight to the third slot. No scanning required—the computer knows exactly where that slot lives.',
          visual: 'array',
        },
        {
          id: 'accessing-02',
          type: 'multiple_choice',
          title: 'Find the value',
          question: 'Given [4, 7, 9, 12], which value is at index 2?',
          options: ['4', '7', '9', '12'],
          answer: 2,
          explanation: 'Correct! Index 2 points to the third element.',
        },
      ],
    },
    {
      id: 'walking-array',
      title: 'Walk the Array',
      description: 'Visit every element from the first slot to the last.',
      skill: 'Iteration',
      estimatedMinutes: 4,
      order: 5,
      icon: '🚶',
      activities: [
        {
          id: 'walking-array-01',
          type: 'explanation',
          title: 'One step at a time',
          content:
            'A loop moves an index from 0 up to the final slot, letting you inspect every element exactly once.',
          visual: 'loop',
        },
        {
          id: 'walking-array-02',
          type: 'true_false',
          title: 'Loop check',
          statement:
            'Looping over an array visits each element in index order.',
          answer: true,
          explanation: 'Right—a simple loop walks the array front to back.',
        },
      ],
    },
    {
      id: 'finding-element',
      title: 'Find an Element',
      description: 'Decide what to do when you are hunting for one value.',
      skill: 'Search',
      estimatedMinutes: 4,
      order: 6,
      icon: '🔍',
      activities: [
        {
          id: 'finding-element-01',
          type: 'explanation',
          title: 'Compare as you go',
          content:
            'While walking the array, compare each element to your target. The moment they match, you are done.',
          visual: 'search',
        },
        {
          id: 'finding-element-02',
          type: 'multiple_choice',
          title: 'Stop or continue?',
          question: 'You find the target at index 1. What should happen next?',
          options: [
            'Return index 1 and stop',
            'Keep checking every remaining slot',
            'Start again from the end',
          ],
          answer: 0,
          explanation: 'Yes—once the value is found there is nothing left to search for.',
        },
      ],
    },
    {
      id: 'linear-search',
      title: 'Linear Search',
      description: 'Name the algorithm you have been building all along.',
      skill: 'Search',
      estimatedMinutes: 5,
      order: 7,
      icon: '📏',
      activities: [
        {
          id: 'linear-search-01',
          type: 'explanation',
          title: 'The whole algorithm',
          content:
            'Linear search checks elements one by one from index 0 until it finds the target or runs out of slots.',
          visual: 'search',
        },
        {
          id: 'linear-search-02',
          type: 'fill_blank',
          title: 'Name the search',
          prompt: 'Checking each element one by one is called ____ search.',
          answer: 'linear',
          acceptableAnswers: ['sequential'],
          explanation: 'Correct! Linear search is also called sequential search.',
        },
        {
          id: 'linear-search-03',
          type: 'multiple_choice',
          title: 'Worst case',
          question: 'Where does linear search do the most work?',
          options: [
            'When the target is the first element',
            'When the target is the last element or missing',
            'When the array is already sorted',
          ],
          answer: 1,
          explanation:
            'Right. If the value sits at the end—or is not there at all—every slot gets checked.',
          hint: 'Think about how many slots must be visited.',
        },
      ],
    },
    {
      id: 'complexity',
      title: 'Counting the Work',
      description: 'Measure an algorithm by how its work grows.',
      skill: 'Complexity',
      estimatedMinutes: 5,
      order: 8,
      icon: '📈',
      activities: [
        {
          id: 'complexity-01',
          type: 'explanation',
          title: 'Growth, not stopwatches',
          content:
            'We describe algorithms by how the number of steps grows with the input size, not by how many seconds they take on one machine.',
          visual: 'chart',
        },
        {
          id: 'complexity-02',
          type: 'multiple_choice',
          title: 'Double the data',
          question:
            'An array doubles in size. How does linear search work change in the worst case?',
          options: [
            'It roughly doubles',
            'It stays the same',
            'It is cut in half',
          ],
          answer: 0,
          explanation:
            'Correct. Twice the slots means up to twice the comparisons.',
        },
      ],
    },
    {
      id: 'review',
      title: 'Array Review',
      description: 'Pull the whole unit back together before the challenge.',
      skill: 'Review',
      estimatedMinutes: 4,
      order: 9,
      icon: '🧠',
      activities: [
        {
          id: 'review-01',
          type: 'true_false',
          title: 'Index recall',
          statement: 'Reading a value by index requires scanning the array.',
          answer: false,
          explanation:
            'Not quite—index access is direct, which is exactly why it is fast.',
        },
        {
          id: 'review-02',
          type: 'fill_blank',
          title: 'Say it in one word',
          prompt: 'Arrays store values in a fixed ____ of slots.',
          answer: 'sequence',
          acceptableAnswers: ['order', 'row'],
          explanation: 'Correct!',
        },
      ],
    },
    {
      id: 'boss-battle',
      title: 'Array Guardian',
      description: 'Prove your array instincts in one final challenge.',
      skill: 'Challenge',
      estimatedMinutes: 6,
      order: 10,
      icon: '🛡️',
      isBoss: true,
      activities: [
        {
          id: 'boss-battle-01',
          type: 'multiple_choice',
          title: 'Guardian question',
          question:
            'Given [5, 3, 8, 1], linear search looks for 8. How many comparisons happen?',
          options: ['1', '2', '3', '4'],
          answer: 2,
          explanation: 'Correct—5, then 3, then 8 on the third comparison.',
          hint: 'Count from index 0 up to the match.',
        },
        {
          id: 'boss-battle-02',
          type: 'true_false',
          title: 'Final check',
          statement: 'Linear search still works on an unsorted array.',
          answer: true,
          explanation:
            'Right. Linear search never assumes order—that is its superpower.',
        },
      ],
    },
    {
      id: 'next-frontier',
      title: 'Next Frontier',
      description: 'A placeholder for the next batch of lessons.',
      skill: 'Preview',
      estimatedMinutes: 1,
      order: 11,
      icon: '🚀',
      activities: [],
    },
  ],
}
