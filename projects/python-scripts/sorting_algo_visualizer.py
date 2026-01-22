import pygame
import random
import math

# --- Configuration ---
WIDTH, HEIGHT = 1000, 600
FPS = 60
WHITE = (255, 255, 255)
BLACK = (30, 30, 30)
RED = (255, 60, 60)      # Active comparison
GREEN = (60, 255, 60)    # Sorted / Pivot
BLUE = (60, 160, 255)    # Default bar color

pygame.init()
screen = pygame.display.set_mode((WIDTH, HEIGHT))
pygame.display.set_caption("Sorting Algorithm Visualizer")
font = pygame.font.SysFont("Arial", 18)
header_font = pygame.font.SysFont("Arial", 24, bold=True)

# --- Sorting Algorithms (Generators) ---

def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
                yield arr, [j, j + 1]

def insertion_sort(arr):
    for i in range(1, len(arr)):
        key = arr[i]
        j = i - 1
        while j >= 0 and key < arr[j]:
            arr[j + 1] = arr[j]
            j -= 1
            yield arr, [j, i]
        arr[j + 1] = key
        yield arr, [i]

def quick_sort(arr, low, high):
    if low < high:
        # Partition logic inside
        pivot = arr[high]
        i = low - 1
        for j in range(low, high):
            if arr[j] <= pivot:
                i += 1
                arr[i], arr[j] = arr[j], arr[i]
                yield arr, [i, j, high]
        arr[i + 1], arr[high] = arr[high], arr[i + 1]
        yield arr, [i + 1, high]
        p = i + 1
        yield from quick_sort(arr, low, p - 1)
        yield from quick_sort(arr, p + 1, high)

def merge_sort(arr, l, r):
    if l < r:
        m = (l + r) // 2
        yield from merge_sort(arr, l, m)
        yield from merge_sort(arr, m + 1, r)
        
        # Merge process
        left = arr[l:m+1]
        right = arr[m+1:r+1]
        k = l
        i = j = 0
        while i < len(left) and j < len(right):
            if left[i] <= right[j]:
                arr[k] = left[i]
                i += 1
            else:
                arr[k] = right[j]
                j += 1
            yield arr, [k]
            k += 1
        while i < len(left):
            arr[k] = left[i]
            i += 1; k += 1
            yield arr, [k]
        while j < len(right):
            arr[k] = right[j]
            j += 1; k += 1
            yield arr, [k]

def heap_sort(arr):
    n = len(arr)
    def heapify(n, i):
        largest = i
        l, r = 2 * i + 1, 2 * i + 2
        if l < n and arr[i] < arr[l]: largest = l
        if r < n and arr[largest] < arr[r]: largest = r
        if largest != i:
            arr[i], arr[largest] = arr[largest], arr[i]
            return largest
        return None

    for i in range(n // 2 - 1, -1, -1):
        # Initial heap build
        curr = i
        while curr is not None:
            res = heapify(n, curr)
            yield arr, [curr]
            curr = res

    for i in range(n - 1, 0, -1):
        arr[i], arr[0] = arr[0], arr[i]
        yield arr, [i, 0]
        curr = 0
        while curr is not None:
            res = heapify(i, curr)
            yield arr, [curr]
            curr = res

def counting_sort(arr):
    if not arr: return
    max_val = int(max(arr))
    counts = [0] * (max_val + 1)
    for x in arr:
        counts[int(x)] += 1
        yield arr, [] # Just to show it's working
    
    idx = 0
    for val, count in enumerate(counts):
        for _ in range(count):
            arr[idx] = val
            idx += 1
            yield arr, [idx]

def timsort(arr):
    # Simplified Timsort: Insertion sort small chunks, then merge
    RUN = 32
    n = len(arr)
    for i in range(0, n, RUN):
        # Local insertion sort
        for j in range(i + 1, min(i + RUN, n)):
            key = arr[j]
            k = j - 1
            while k >= i and arr[k] > key:
                arr[k+1] = arr[k]
                k -= 1
                yield arr, [k, j]
            arr[k+1] = key
    
    size = RUN
    while size < n:
        for left in range(0, n, 2 * size):
            mid = min(n - 1, left + size - 1)
            right = min((left + 2 * size - 1), (n - 1))
            if mid < right:
                # Merge logic (similar to merge sort)
                l_part = arr[left:mid+1]
                r_part = arr[mid+1:right+1]
                li = ri = 0
                for k in range(left, right + 1):
                    if li < len(l_part) and (ri >= len(r_part) or l_part[li] <= r_part[ri]):
                        arr[k] = l_part[li]; li += 1
                    else:
                        arr[k] = r_part[ri]; ri += 1
                    yield arr, [k]
        size *= 2

def cached_bogo_sort(arr):
    def is_sorted(a):
        for i in range(len(a) - 1):
            if a[i] > a[i + 1]: return False
        return True
    
    # We limit the size because even with a cache, 
    # the number of permutations (n!) grows explosively.
    # 6! = 720, 10! = 3,628,800
    bogo_subset_size = 6 
    subset = arr[:bogo_subset_size]
    
    # The 'Cache' - storing seen permutations to avoid repeats
    visited_states = set()
    
    # Add the initial state
    visited_states.add(tuple(subset))

    while not is_sorted(subset):
        random.shuffle(subset)
        state = tuple(subset)
        
        # If we've seen this mess before, skip the visualization and reshuffle
        if state in visited_states:
            continue 
            
        # New unique state found! Add to cache and show the user
        visited_states.add(state)
        
        for i in range(bogo_subset_size): 
            arr[i] = subset[i]
            
        # Yield the array and highlight the subset being shuffled
        yield arr, list(range(bogo_subset_size))
        
    yield arr, []

# --- Visualization Logic ---

def draw_bars(arr, highlights, algo_name):
    screen.fill(BLACK)
    
    # UI Text
    txt = header_font.render(f"Algorithm: {algo_name}", True, WHITE)
    screen.blit(txt, (20, 20))
    instr = font.render("1:Bubble | 2:Insertion | 3:Quick | 4:Merge | 5:Heap | 6:Counting | 7:Timsort | 8:Bogo | R:Reset", True, WHITE)
    screen.blit(instr, (20, 55))

    bar_width = WIDTH // len(arr)
    max_h = max(arr) if arr else 1
    
    for i, val in enumerate(arr):
        color = BLUE
        if i in highlights:
            color = RED
        
        # Normalize height
        normalized_h = (val / max_h) * (HEIGHT - 150)
        pygame.draw.rect(screen, color, (i * bar_width, HEIGHT - normalized_h, bar_width - 1, normalized_h))
    
    pygame.display.flip()

def main():
    n = 100
    data = [random.randint(10, 500) for _ in range(n)]
    current_arr = list(data)
    
    algo_generator = None
    algo_name = "Select an Algorithm"
    running = True
    sorting = False
    highlights = []
    clock = pygame.time.Clock()

    while running:
        clock.tick(FPS)
        
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
            
            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_r:
                    current_arr = [random.randint(10, 500) for _ in range(n)]
                    sorting = False
                    algo_name = "Reset!"
                
                # Algorithm Selection
                if not sorting:
                    if event.key == pygame.K_1:
                        algo_generator = bubble_sort(current_arr)
                        algo_name = "Bubble Sort"
                        sorting = True
                    if event.key == pygame.K_2:
                        algo_generator = insertion_sort(current_arr)
                        algo_name = "Insertion Sort"
                        sorting = True
                    if event.key == pygame.K_3:
                        algo_generator = quick_sort(current_arr, 0, len(current_arr)-1)
                        algo_name = "Quick Sort"
                        sorting = True
                    if event.key == pygame.K_4:
                        algo_generator = merge_sort(current_arr, 0, len(current_arr)-1)
                        algo_name = "Merge Sort"
                        sorting = True
                    if event.key == pygame.K_5:
                        algo_generator = heap_sort(current_arr)
                        algo_name = "Heap Sort"
                        sorting = True
                    if event.key == pygame.K_6:
                        algo_generator = counting_sort(current_arr)
                        algo_name = "Counting Sort"
                        sorting = True
                    if event.key == pygame.K_7:
                        algo_generator = timsort(current_arr)
                        algo_name = "Timsort"
                        sorting = True
                    if event.key == pygame.K_8:
                        # Bogo is too slow for 100 elements, let's use a smaller array for it
                        current_arr = [random.randint(10, 500) for _ in range(8)]
                        algo_generator = cached_bogo_sort(current_arr)
                        algo_name = "Cached Bogo Sort (N=8)"
                        sorting = True

        if sorting and algo_generator:
            try:
                # Get the next state from the generator
                res = next(algo_generator)
                current_arr, highlights = res[0], res[1]
            except StopIteration:
                sorting = False
                highlights = []

        draw_bars(current_arr, highlights, algo_name)

    pygame.quit()

if __name__ == "__main__":
    main()