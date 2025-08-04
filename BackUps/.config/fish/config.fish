function fish_prompt -d "Write out the prompt"
    # This shows up as USER@HOST /home/user/ >, with the directory colored
    # $USER and $hostname are set by fish, so you can just use them
    # instead of using `whoami` and `hostname`
    printf '%s@%s %s%s%s > ' $USER $hostname \
        (set_color $fish_color_cwd) (prompt_pwd) (set_color normal)
end

if status is-interactive
    # Commands to run in interactive sessions can go here
    set fish_greeting

    # Source aliases if the file exists
    set aliases_file (dirname (status --current-filename))/aliases.fish
    if test -f "$aliases_file"
        source "$aliases_file"
    end

    # Initialize starship prompt
    starship init fish | source

    # Display sequences if they exist
    set sequences_file ~/.local/state/quickshell/user/generated/terminal/sequences.txt
    if test -f "$sequences_file"
        cat "$sequences_file"
    end
end
