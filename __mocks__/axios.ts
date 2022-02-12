import { AxiosResponse } from 'axios';

export default {
  get: vi.fn((url) => {
    switch (url) {
      case 'https://www.taobao.com/robots.txt': {
        return Promise.resolve({
          status: 200,
          statusText: 'OK',
          data: {
            code: 200,
            data: 'hehe',
          },
        } as AxiosResponse);
      }
      case 'https://github.com/isaacs/github/issues/1133': {
        return Promise.resolve({
          status: 200,
          statusText: 'OK',
          data: `  <div class=" timeline-comment-group js-minimizable-comment-group js-targetable-element TimelineItem-body my-0 " id="issuecomment-363996601">
            <div class="ml-n3 minimized-comment position-relative  js-comment">
      
          <div class=" timeline-comment-group js-minimizable-comment-group js-targetable-element TimelineItem-body my-0 " id="issuecomment-374220000">
          <div class="ml-n3 timeline-comment unminimized-comment comment previewable-edit js-task-list-container js-comment timeline-comment--caret"
              data-body-version="0084efdc2caae774849e0fd8cddd6171c6ef60461f29ae9e0e7ea67716cef832">
              <clipboard-copy aria-label="Copy link" for="issuecomment-374220000-permalink" role="menuitem" data-view-component="true" class="dropdown-item btn-link">
              <a href="#issuecomment-374220000" id="issuecomment-374220000-permalink" class="Link--secondary js-timestamp"><relative-time datetime="2018-03-19T13:56:24Z" class="no-wrap">Mar 19, 2018</relative-time></a>
      
              </option></form><form class="js-comment-update" id="issuecomment-374220000-edit-form" action="/isaacs/github/issue_comments/374220000" accept-charset="UTF-8" method="post"><input type="hidden" name="_method" value="put" autocomplete="off" /><input type="hidden" data-csrf="true" name="authenticity_token" value="k6TPJIjM9Fr6T5PZFZM/Fh4U2HhDYd9qmFq1BOBYkA0rZZ+PCO9LR4afTApe5U89nzggfK4L5OSxRjtU0op5mA==" />
              <include-fragment
      
        loading="lazy"
        src="/isaacs/github/issue_comments/374220000/edit_form?textarea_id=issuecomment-374220000-body&amp;comment_context="
        class="previewable-comment-form js-comment-edit-form-deferred-include-fragment"
        >
             `,
        } as AxiosResponse);
      }
      case 'https://github.com/isaacs/github/issues/0': {
        return Promise.reject(new Error('Request failed with status code 404'));
      }
      default: {
        return Promise.reject(new Error(`${url} not mocked`));
      }
    }
  }),
};
