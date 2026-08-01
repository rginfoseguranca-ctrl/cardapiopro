import { createRepository, BaseRepository } from './base'
import { BlogPost } from './types'

export const blogPostsRepository: BaseRepository<BlogPost> = createRepository<BlogPost>('blog_posts', {
  columns: ['title', 'slug', 'content', 'excerpt', 'image', 'author', 'is_published', 'published_at'],
})

export function findBlogBySlug(
  storeId: string | null,
  slug: string,
  repo: BaseRepository<BlogPost> = blogPostsRepository
): BlogPost | null {
  if (!slug) return null
  return repo.findOne(storeId, 'slug = ?', [slug])
}
