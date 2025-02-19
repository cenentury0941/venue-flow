export class FixedLengthQueue {
    constructor(maxSize) {
      this.maxSize = maxSize;
      this.queue = [];
    }
  
    // Add an element to the queue
    enqueue(item) {
      if (this.queue.length >= this.maxSize) {
        // Remove the oldest element (first item) to make space
        this.queue.shift();
      }
      this.queue.push(item);
    }
  
    // Remove and return the first item from the queue
    dequeue() {
      return this.queue.shift();
    }
  
    // Return the first item without removing it
    front() {
      return this.queue[0];
    }
  
    // Check if the queue is empty
    isEmpty() {
      return this.queue.length === 0;
    }
  
    // Get the current size of the queue
    size() {
      return this.queue.length;
    }
  
    // Get all the items in the queue
    getAllItems() {
      return [...this.queue];
    }

    // Calculate and return the average of the queue's items
    avg() {
    if (this.queue.length === 0) return 0; // Return 0 if queue is empty
    const sum = this.queue.reduce((acc, num) => acc + num, 0);
    return parseInt(sum / this.queue.length);
    }
  }
  
  