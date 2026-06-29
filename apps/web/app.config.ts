export default defineAppConfig({
  ui: {
    modal: {
      variants: {
        transition: {
          true: {
            overlay:
              'data-[state=open]:animate-[pz-fade-in_200ms_ease-out] data-[state=closed]:animate-[pz-fade-out_200ms_ease-in]',
            content:
              'data-[state=open]:animate-[pz-modal-in_200ms_ease-out] data-[state=closed]:animate-[pz-modal-out_200ms_ease-in]',
          },
        },
      },
    },
    drawer: {
      slots: {
        overlay: 'fixed inset-0 bg-black/35',
      },
      compoundVariants: [
        {
          direction: 'left',
          class: {
            content:
              'data-[state=open]:animate-[pz-drawer-in-left_200ms_ease-out] data-[state=closed]:animate-[pz-drawer-out-left_200ms_ease-in]',
          },
        },
      ],
    },
    slideover: {
      slots: {
        overlay: 'fixed inset-0 bg-black/35',
      },
      variants: {
        transition: {
          true: {
            overlay:
              'data-[state=open]:animate-[pz-fade-in_200ms_ease-out] data-[state=closed]:animate-[pz-fade-out_200ms_ease-in]',
            content:
              'data-[state=open]:animate-[pz-modal-in_200ms_ease-out] data-[state=closed]:animate-[pz-modal-out_200ms_ease-in]',
          },
        },
      },
    },
  },
})
